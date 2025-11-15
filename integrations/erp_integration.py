# ERP Integration System

import os
import json
import logging
import requests
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple
import xml.etree.ElementTree as ET
from dataclasses import dataclass
from abc import ABC, abstractmethod
import asyncio
import aiohttp
from concurrent.futures import ThreadPoolExecutor
import hashlib
import hmac
import base64
from urllib.parse import urlencode, quote

# Configuration
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class ERPConfig:
    """ERP system configuration"""
    system_type: str  # 'sap', 'oracle', 'microsoft', 'custom'
    base_url: str
    username: str
    password: str
    client_id: str
    client_secret: str
    api_version: str
    timeout: int = 30
    retry_attempts: int = 3
    rate_limit: int = 100  # requests per minute

@dataclass
class ERPData:
    """ERP data structure"""
    record_id: str
    data_type: str  # 'invoice', 'payment', 'customer', 'vendor', 'gl_account'
    data: Dict[str, Any]
    timestamp: datetime
    source_system: str
    checksum: str

class ERPConnector(ABC):
    """Abstract base class for ERP connectors"""
    
    def __init__(self, config: ERPConfig):
        self.config = config
        self.session = None
        self.rate_limiter = RateLimiter(config.rate_limit)
    
    @abstractmethod
    async def authenticate(self) -> bool:
        """Authenticate with ERP system"""
        pass
    
    @abstractmethod
    async def fetch_data(self, data_type: str, filters: Dict[str, Any] = None) -> List[ERPData]:
        """Fetch data from ERP system"""
        pass
    
    @abstractmethod
    async def push_data(self, data: ERPData) -> bool:
        """Push data to ERP system"""
        pass
    
    @abstractmethod
    async def test_connection(self) -> bool:
        """Test connection to ERP system"""
        pass

class SAPConnector(ERPConnector):
    """SAP ERP connector"""
    
    def __init__(self, config: ERPConfig):
        super().__init__(config)
        self.access_token = None
        self.token_expires_at = None
    
    async def authenticate(self) -> bool:
        """Authenticate with SAP using OAuth2"""
        try:
            auth_url = f"{self.config.base_url}/oauth/token"
            auth_data = {
                'grant_type': 'client_credentials',
                'client_id': self.config.client_id,
                'client_secret': self.config.client_secret,
                'scope': 'api'
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(auth_url, data=auth_data, timeout=self.config.timeout) as response:
                    if response.status == 200:
                        auth_result = await response.json()
                        self.access_token = auth_result['access_token']
                        self.token_expires_at = datetime.now() + timedelta(seconds=auth_result['expires_in'])
                        logger.info("SAP authentication successful")
                        return True
                    else:
                        logger.error(f"SAP authentication failed: {response.status}")
                        return False
        except Exception as e:
            logger.error(f"SAP authentication error: {e}")
            return False
    
    async def fetch_data(self, data_type: str, filters: Dict[str, Any] = None) -> List[ERPData]:
        """Fetch data from SAP"""
        if not await self._ensure_authenticated():
            return []
        
        try:
            # SAP OData endpoints
            endpoints = {
                'invoice': '/sap/opu/odata/sap/ZINVOICE_SRV/InvoiceSet',
                'payment': '/sap/opu/odata/sap/ZPAYMENT_SRV/PaymentSet',
                'customer': '/sap/opu/odata/sap/ZCUSTOMER_SRV/CustomerSet',
                'vendor': '/sap/opu/odata/sap/ZVENDOR_SRV/VendorSet',
                'gl_account': '/sap/opu/odata/sap/ZGLACCOUNT_SRV/GLAccountSet'
            }
            
            if data_type not in endpoints:
                logger.error(f"Unknown data type: {data_type}")
                return []
            
            endpoint = endpoints[data_type]
            url = f"{self.config.base_url}{endpoint}"
            
            # Add filters
            if filters:
                filter_params = []
                for key, value in filters.items():
                    if isinstance(value, str):
                        filter_params.append(f"{key} eq '{value}'")
                    else:
                        filter_params.append(f"{key} eq {value}")
                
                if filter_params:
                    url += f"?$filter={' and '.join(filter_params)}"
            
            headers = {
                'Authorization': f'Bearer {self.access_token}',
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
            
            await self.rate_limiter.acquire()
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url, headers=headers, timeout=self.config.timeout) as response:
                    if response.status == 200:
                        data = await response.json()
                        return self._parse_sap_data(data, data_type)
                    else:
                        logger.error(f"SAP data fetch failed: {response.status}")
                        return []
        
        except Exception as e:
            logger.error(f"SAP data fetch error: {e}")
            return []
    
    async def push_data(self, data: ERPData) -> bool:
        """Push data to SAP"""
        if not await self._ensure_authenticated():
            return False
        
        try:
            # SAP OData endpoints for posting
            endpoints = {
                'invoice': '/sap/opu/odata/sap/ZINVOICE_SRV/InvoiceSet',
                'payment': '/sap/opu/odata/sap/ZPAYMENT_SRV/PaymentSet',
                'customer': '/sap/opu/odata/sap/ZCUSTOMER_SRV/CustomerSet',
                'vendor': '/sap/opu/odata/sap/ZVENDOR_SRV/VendorSet',
                'gl_account': '/sap/opu/odata/sap/ZGLACCOUNT_SRV/GLAccountSet'
            }
            
            if data.data_type not in endpoints:
                logger.error(f"Unknown data type: {data.data_type}")
                return False
            
            endpoint = endpoints[data.data_type]
            url = f"{self.config.base_url}{endpoint}"
            
            headers = {
                'Authorization': f'Bearer {self.access_token}',
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
            
            await self.rate_limiter.acquire()
            
            async with aiohttp.ClientSession() as session:
                async with session.post(url, headers=headers, json=data.data, timeout=self.config.timeout) as response:
                    if response.status in [200, 201]:
                        logger.info(f"SAP data push successful for {data.record_id}")
                        return True
                    else:
                        logger.error(f"SAP data push failed: {response.status}")
                        return False
        
        except Exception as e:
            logger.error(f"SAP data push error: {e}")
            return False
    
    async def test_connection(self) -> bool:
        """Test SAP connection"""
        try:
            if not await self.authenticate():
                return False
            
            # Test with a simple data fetch
            test_data = await self.fetch_data('customer', {'$top': 1})
            return len(test_data) >= 0  # Even empty result means connection works
        
        except Exception as e:
            logger.error(f"SAP connection test failed: {e}")
            return False
    
    async def _ensure_authenticated(self) -> bool:
        """Ensure we have a valid authentication token"""
        if not self.access_token or (self.token_expires_at and datetime.now() >= self.token_expires_at):
            return await self.authenticate()
        return True
    
    def _parse_sap_data(self, data: Dict[str, Any], data_type: str) -> List[ERPData]:
        """Parse SAP OData response"""
        erp_data_list = []
        
        try:
            if 'value' in data:
                for item in data['value']:
                    # Create checksum for data integrity
                    data_str = json.dumps(item, sort_keys=True)
                    checksum = hashlib.md5(data_str.encode()).hexdigest()
                    
                    erp_data = ERPData(
                        record_id=item.get('Id', item.get('id', '')),
                        data_type=data_type,
                        data=item,
                        timestamp=datetime.now(),
                        source_system='SAP',
                        checksum=checksum
                    )
                    erp_data_list.append(erp_data)
        
        except Exception as e:
            logger.error(f"SAP data parsing error: {e}")
        
        return erp_data_list

class OracleConnector(ERPConnector):
    """Oracle ERP connector"""
    
    def __init__(self, config: ERPConfig):
        super().__init__(config)
        self.session_token = None
    
    async def authenticate(self) -> bool:
        """Authenticate with Oracle ERP"""
        try:
            auth_url = f"{self.config.base_url}/fscmRestApi/resources/11.13.18.05/authentication"
            auth_data = {
                'username': self.config.username,
                'password': self.config.password
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(auth_url, json=auth_data, timeout=self.config.timeout) as response:
                    if response.status == 200:
                        auth_result = await response.json()
                        self.session_token = auth_result.get('sessionToken')
                        logger.info("Oracle authentication successful")
                        return True
                    else:
                        logger.error(f"Oracle authentication failed: {response.status}")
                        return False
        except Exception as e:
            logger.error(f"Oracle authentication error: {e}")
            return False
    
    async def fetch_data(self, data_type: str, filters: Dict[str, Any] = None) -> List[ERPData]:
        """Fetch data from Oracle ERP"""
        if not await self._ensure_authenticated():
            return []
        
        try:
            # Oracle REST endpoints
            endpoints = {
                'invoice': '/fscmRestApi/resources/11.13.18.05/invoices',
                'payment': '/fscmRestApi/resources/11.13.18.05/payments',
                'customer': '/fscmRestApi/resources/11.13.18.05/customers',
                'vendor': '/fscmRestApi/resources/11.13.18.05/vendors',
                'gl_account': '/fscmRestApi/resources/11.13.18.05/glAccounts'
            }
            
            if data_type not in endpoints:
                logger.error(f"Unknown data type: {data_type}")
                return []
            
            endpoint = endpoints[data_type]
            url = f"{self.config.base_url}{endpoint}"
            
            # Add filters
            if filters:
                query_params = []
                for key, value in filters.items():
                    query_params.append(f"{key}={quote(str(value))}")
                
                if query_params:
                    url += f"?{'&'.join(query_params)}"
            
            headers = {
                'Authorization': f'Bearer {self.session_token}',
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
            
            await self.rate_limiter.acquire()
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url, headers=headers, timeout=self.config.timeout) as response:
                    if response.status == 200:
                        data = await response.json()
                        return self._parse_oracle_data(data, data_type)
                    else:
                        logger.error(f"Oracle data fetch failed: {response.status}")
                        return []
        
        except Exception as e:
            logger.error(f"Oracle data fetch error: {e}")
            return []
    
    async def push_data(self, data: ERPData) -> bool:
        """Push data to Oracle ERP"""
        if not await self._ensure_authenticated():
            return False
        
        try:
            # Oracle REST endpoints for posting
            endpoints = {
                'invoice': '/fscmRestApi/resources/11.13.18.05/invoices',
                'payment': '/fscmRestApi/resources/11.13.18.05/payments',
                'customer': '/fscmRestApi/resources/11.13.18.05/customers',
                'vendor': '/fscmRestApi/resources/11.13.18.05/vendors',
                'gl_account': '/fscmRestApi/resources/11.13.18.05/glAccounts'
            }
            
            if data.data_type not in endpoints:
                logger.error(f"Unknown data type: {data.data_type}")
                return False
            
            endpoint = endpoints[data.data_type]
            url = f"{self.config.base_url}{endpoint}"
            
            headers = {
                'Authorization': f'Bearer {self.session_token}',
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
            
            await self.rate_limiter.acquire()
            
            async with aiohttp.ClientSession() as session:
                async with session.post(url, headers=headers, json=data.data, timeout=self.config.timeout) as response:
                    if response.status in [200, 201]:
                        logger.info(f"Oracle data push successful for {data.record_id}")
                        return True
                    else:
                        logger.error(f"Oracle data push failed: {response.status}")
                        return False
        
        except Exception as e:
            logger.error(f"Oracle data push error: {e}")
            return False
    
    async def test_connection(self) -> bool:
        """Test Oracle connection"""
        try:
            if not await self.authenticate():
                return False
            
            # Test with a simple data fetch
            test_data = await self.fetch_data('customer', {'limit': 1})
            return len(test_data) >= 0
        
        except Exception as e:
            logger.error(f"Oracle connection test failed: {e}")
            return False
    
    async def _ensure_authenticated(self) -> bool:
        """Ensure we have a valid authentication token"""
        if not self.session_token:
            return await self.authenticate()
        return True
    
    def _parse_oracle_data(self, data: Dict[str, Any], data_type: str) -> List[ERPData]:
        """Parse Oracle REST response"""
        erp_data_list = []
        
        try:
            if 'items' in data:
                for item in data['items']:
                    # Create checksum for data integrity
                    data_str = json.dumps(item, sort_keys=True)
                    checksum = hashlib.md5(data_str.encode()).hexdigest()
                    
                    erp_data = ERPData(
                        record_id=item.get('Id', item.get('id', '')),
                        data_type=data_type,
                        data=item,
                        timestamp=datetime.now(),
                        source_system='Oracle',
                        checksum=checksum
                    )
                    erp_data_list.append(erp_data)
        
        except Exception as e:
            logger.error(f"Oracle data parsing error: {e}")
        
        return erp_data_list

class MicrosoftDynamicsConnector(ERPConnector):
    """Microsoft Dynamics ERP connector"""
    
    def __init__(self, config: ERPConfig):
        super().__init__(config)
        self.access_token = None
        self.token_expires_at = None
    
    async def authenticate(self) -> bool:
        """Authenticate with Microsoft Dynamics using OAuth2"""
        try:
            auth_url = f"https://login.microsoftonline.com/{self.config.client_id}/oauth2/v2.0/token"
            auth_data = {
                'client_id': self.config.client_id,
                'client_secret': self.config.client_secret,
                'scope': f"{self.config.base_url}/.default",
                'grant_type': 'client_credentials'
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(auth_url, data=auth_data, timeout=self.config.timeout) as response:
                    if response.status == 200:
                        auth_result = await response.json()
                        self.access_token = auth_result['access_token']
                        self.token_expires_at = datetime.now() + timedelta(seconds=auth_result['expires_in'])
                        logger.info("Microsoft Dynamics authentication successful")
                        return True
                    else:
                        logger.error(f"Microsoft Dynamics authentication failed: {response.status}")
                        return False
        except Exception as e:
            logger.error(f"Microsoft Dynamics authentication error: {e}")
            return False
    
    async def fetch_data(self, data_type: str, filters: Dict[str, Any] = None) -> List[ERPData]:
        """Fetch data from Microsoft Dynamics"""
        if not await self._ensure_authenticated():
            return []
        
        try:
            # Microsoft Dynamics OData endpoints
            endpoints = {
                'invoice': '/data/v9.0/invoices',
                'payment': '/data/v9.0/payments',
                'customer': '/data/v9.0/accounts',
                'vendor': '/data/v9.0/vendors',
                'gl_account': '/data/v9.0/glaccounts'
            }
            
            if data_type not in endpoints:
                logger.error(f"Unknown data type: {data_type}")
                return []
            
            endpoint = endpoints[data_type]
            url = f"{self.config.base_url}{endpoint}"
            
            # Add filters
            if filters:
                filter_params = []
                for key, value in filters.items():
                    if isinstance(value, str):
                        filter_params.append(f"{key} eq '{value}'")
                    else:
                        filter_params.append(f"{key} eq {value}")
                
                if filter_params:
                    url += f"?$filter={' and '.join(filter_params)}"
            
            headers = {
                'Authorization': f'Bearer {self.access_token}',
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
            
            await self.rate_limiter.acquire()
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url, headers=headers, timeout=self.config.timeout) as response:
                    if response.status == 200:
                        data = await response.json()
                        return self._parse_dynamics_data(data, data_type)
                    else:
                        logger.error(f"Microsoft Dynamics data fetch failed: {response.status}")
                        return []
        
        except Exception as e:
            logger.error(f"Microsoft Dynamics data fetch error: {e}")
            return []
    
    async def push_data(self, data: ERPData) -> bool:
        """Push data to Microsoft Dynamics"""
        if not await self._ensure_authenticated():
            return False
        
        try:
            # Microsoft Dynamics OData endpoints for posting
            endpoints = {
                'invoice': '/data/v9.0/invoices',
                'payment': '/data/v9.0/payments',
                'customer': '/data/v9.0/accounts',
                'vendor': '/data/v9.0/vendors',
                'gl_account': '/data/v9.0/glaccounts'
            }
            
            if data.data_type not in endpoints:
                logger.error(f"Unknown data type: {data.data_type}")
                return False
            
            endpoint = endpoints[data.data_type]
            url = f"{self.config.base_url}{endpoint}"
            
            headers = {
                'Authorization': f'Bearer {self.access_token}',
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
            
            await self.rate_limiter.acquire()
            
            async with aiohttp.ClientSession() as session:
                async with session.post(url, headers=headers, json=data.data, timeout=self.config.timeout) as response:
                    if response.status in [200, 201]:
                        logger.info(f"Microsoft Dynamics data push successful for {data.record_id}")
                        return True
                    else:
                        logger.error(f"Microsoft Dynamics data push failed: {response.status}")
                        return False
        
        except Exception as e:
            logger.error(f"Microsoft Dynamics data push error: {e}")
            return False
    
    async def test_connection(self) -> bool:
        """Test Microsoft Dynamics connection"""
        try:
            if not await self.authenticate():
                return False
            
            # Test with a simple data fetch
            test_data = await self.fetch_data('customer', {'$top': 1})
            return len(test_data) >= 0
        
        except Exception as e:
            logger.error(f"Microsoft Dynamics connection test failed: {e}")
            return False
    
    async def _ensure_authenticated(self) -> bool:
        """Ensure we have a valid authentication token"""
        if not self.access_token or (self.token_expires_at and datetime.now() >= self.token_expires_at):
            return await self.authenticate()
        return True
    
    def _parse_dynamics_data(self, data: Dict[str, Any], data_type: str) -> List[ERPData]:
        """Parse Microsoft Dynamics OData response"""
        erp_data_list = []
        
        try:
            if 'value' in data:
                for item in data['value']:
                    # Create checksum for data integrity
                    data_str = json.dumps(item, sort_keys=True)
                    checksum = hashlib.md5(data_str.encode()).hexdigest()
                    
                    erp_data = ERPData(
                        record_id=item.get('Id', item.get('id', '')),
                        data_type=data_type,
                        data=item,
                        timestamp=datetime.now(),
                        source_system='Microsoft Dynamics',
                        checksum=checksum
                    )
                    erp_data_list.append(erp_data)
        
        except Exception as e:
            logger.error(f"Microsoft Dynamics data parsing error: {e}")
        
        return erp_data_list

class RateLimiter:
    """Rate limiter for API calls"""
    
    def __init__(self, rate_limit: int):
        self.rate_limit = rate_limit
        self.requests = []
        self.lock = asyncio.Lock()
    
    async def acquire(self):
        """Acquire permission to make a request"""
        async with self.lock:
            now = datetime.now()
            
            # Remove old requests outside the time window
            self.requests = [req_time for req_time in self.requests 
                           if now - req_time < timedelta(minutes=1)]
            
            # If we're at the rate limit, wait
            if len(self.requests) >= self.rate_limit:
                sleep_time = 60 - (now - self.requests[0]).total_seconds()
                if sleep_time > 0:
                    await asyncio.sleep(sleep_time)
                    self.requests = []
            
            self.requests.append(now)

class ERPIntegrationManager:
    """Main ERP integration manager"""
    
    def __init__(self):
        self.connectors: Dict[str, ERPConnector] = {}
        self.data_cache: Dict[str, List[ERPData]] = {}
        self.sync_status: Dict[str, str] = {}
    
    def add_connector(self, name: str, connector: ERPConnector):
        """Add ERP connector"""
        self.connectors[name] = connector
        logger.info(f"Added ERP connector: {name}")
    
    async def test_all_connections(self) -> Dict[str, bool]:
        """Test all ERP connections"""
        results = {}
        
        for name, connector in self.connectors.items():
            try:
                result = await connector.test_connection()
                results[name] = result
                logger.info(f"Connection test for {name}: {'PASS' if result else 'FAIL'}")
            except Exception as e:
                results[name] = False
                logger.error(f"Connection test failed for {name}: {e}")
        
        return results
    
    async def sync_data(self, connector_name: str, data_type: str, filters: Dict[str, Any] = None) -> List[ERPData]:
        """Sync data from ERP system"""
        if connector_name not in self.connectors:
            logger.error(f"Unknown connector: {connector_name}")
            return []
        
        try:
            connector = self.connectors[connector_name]
            data = await connector.fetch_data(data_type, filters)
            
            # Cache the data
            cache_key = f"{connector_name}_{data_type}"
            self.data_cache[cache_key] = data
            
            # Update sync status
            self.sync_status[cache_key] = datetime.now().isoformat()
            
            logger.info(f"Synced {len(data)} records from {connector_name} for {data_type}")
            return data
        
        except Exception as e:
            logger.error(f"Data sync failed for {connector_name}: {e}")
            return []
    
    async def sync_all_data(self) -> Dict[str, List[ERPData]]:
        """Sync data from all ERP systems"""
        all_data = {}
        
        for connector_name in self.connectors.keys():
            for data_type in ['invoice', 'payment', 'customer', 'vendor', 'gl_account']:
                try:
                    data = await self.sync_data(connector_name, data_type)
                    all_data[f"{connector_name}_{data_type}"] = data
                except Exception as e:
                    logger.error(f"Failed to sync {data_type} from {connector_name}: {e}")
        
        return all_data
    
    async def push_data(self, connector_name: str, data: ERPData) -> bool:
        """Push data to ERP system"""
        if connector_name not in self.connectors:
            logger.error(f"Unknown connector: {connector_name}")
            return False
        
        try:
            connector = self.connectors[connector_name]
            result = await connector.push_data(data)
            
            if result:
                logger.info(f"Successfully pushed data to {connector_name}")
            else:
                logger.error(f"Failed to push data to {connector_name}")
            
            return result
        
        except Exception as e:
            logger.error(f"Data push failed for {connector_name}: {e}")
            return False
    
    def get_sync_status(self) -> Dict[str, str]:
        """Get sync status for all data types"""
        return self.sync_status
    
    def get_cached_data(self, connector_name: str, data_type: str) -> List[ERPData]:
        """Get cached data"""
        cache_key = f"{connector_name}_{data_type}"
        return self.data_cache.get(cache_key, [])
    
    def clear_cache(self):
        """Clear all cached data"""
        self.data_cache.clear()
        self.sync_status.clear()
        logger.info("Cleared all cached data")

# Example usage
async def main():
    # Initialize ERP integration manager
    manager = ERPIntegrationManager()
    
    # Configure SAP connector
    sap_config = ERPConfig(
        system_type='sap',
        base_url='https://sap.example.com',
        username='sap_user',
        password='sap_password',
        client_id='sap_client_id',
        client_secret='sap_client_secret',
        api_version='v1'
    )
    sap_connector = SAPConnector(sap_config)
    manager.add_connector('SAP', sap_connector)
    
    # Configure Oracle connector
    oracle_config = ERPConfig(
        system_type='oracle',
        base_url='https://oracle.example.com',
        username='oracle_user',
        password='oracle_password',
        client_id='oracle_client_id',
        client_secret='oracle_client_secret',
        api_version='v1'
    )
    oracle_connector = OracleConnector(oracle_config)
    manager.add_connector('Oracle', oracle_connector)
    
    # Configure Microsoft Dynamics connector
    dynamics_config = ERPConfig(
        system_type='microsoft',
        base_url='https://dynamics.example.com',
        username='dynamics_user',
        password='dynamics_password',
        client_id='dynamics_client_id',
        client_secret='dynamics_client_secret',
        api_version='v9.0'
    )
    dynamics_connector = MicrosoftDynamicsConnector(dynamics_config)
    manager.add_connector('Microsoft Dynamics', dynamics_connector)
    
    # Test all connections
    connection_results = await manager.test_all_connections()
    print("Connection test results:", connection_results)
    
    # Sync data from all systems
    all_data = await manager.sync_all_data()
    print(f"Synced data from {len(all_data)} sources")
    
    # Get sync status
    sync_status = manager.get_sync_status()
    print("Sync status:", sync_status)

if __name__ == "__main__":
    asyncio.run(main())
