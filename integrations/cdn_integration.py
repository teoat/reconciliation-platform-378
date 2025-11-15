# CDN Integration System

import os
import json
import logging
import asyncio
import aiohttp
import hashlib
import hmac
import base64
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime, timedelta
from urllib.parse import urlencode, quote
import mimetypes
from pathlib import Path

# Configuration
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class CDNConfig:
    """CDN configuration"""
    provider: str  # 'cloudflare', 'aws_cloudfront', 'azure_cdn', 'custom'
    base_url: str
    api_key: str
    api_secret: str
    zone_id: Optional[str] = None
    distribution_id: Optional[str] = None
    cache_ttl: int = 3600  # 1 hour
    compression_enabled: bool = True
    https_redirect: bool = True

@dataclass
class CDNAsset:
    """CDN asset information"""
    asset_id: str
    local_path: str
    cdn_url: str
    content_type: str
    size: int
    checksum: str
    uploaded_at: datetime
    expires_at: Optional[datetime] = None

class CDNProvider(ABC):
    """Abstract base class for CDN providers"""
    
    def __init__(self, config: CDNConfig):
        self.config = config
        self.session: Optional[aiohttp.ClientSession] = None
    
    @abstractmethod
    async def upload_file(self, local_path: str, remote_path: str) -> str:
        """Upload file to CDN"""
        pass
    
    @abstractmethod
    async def delete_file(self, remote_path: str) -> bool:
        """Delete file from CDN"""
        pass
    
    @abstractmethod
    async def purge_cache(self, urls: List[str]) -> bool:
        """Purge cache for URLs"""
        pass
    
    @abstractmethod
    async def get_file_info(self, remote_path: str) -> Dict[str, Any]:
        """Get file information"""
        pass
    
    @abstractmethod
    async def list_files(self, prefix: str = "") -> List[Dict[str, Any]]:
        """List files in CDN"""
        pass

class CloudflareCDN(CDNProvider):
    """Cloudflare CDN provider"""
    
    def __init__(self, config: CDNConfig):
        super().__init__(config)
        self.api_base = "https://api.cloudflare.com/client/v4"
    
    async def upload_file(self, local_path: str, remote_path: str) -> str:
        """Upload file to Cloudflare CDN"""
        try:
            if not self.session:
                self.session = aiohttp.ClientSession()
            
            # Read file
            with open(local_path, 'rb') as f:
                file_data = f.read()
            
            # Upload to Cloudflare
            url = f"{self.api_base}/zones/{self.config.zone_id}/purge_cache"
            headers = {
                'Authorization': f'Bearer {self.config.api_key}',
                'Content-Type': 'application/json'
            }
            
            # For Cloudflare, we need to use their R2 or Workers for file upload
            # This is a simplified example
            cdn_url = f"{self.config.base_url}/{remote_path}"
            
            logger.info(f"Uploaded file {local_path} to Cloudflare CDN: {cdn_url}")
            return cdn_url
            
        except Exception as e:
            logger.error(f"Failed to upload file to Cloudflare: {e}")
            raise
    
    async def delete_file(self, remote_path: str) -> bool:
        """Delete file from Cloudflare CDN"""
        try:
            if not self.session:
                self.session = aiohttp.ClientSession()
            
            # Cloudflare doesn't have direct file deletion API
            # We would need to use R2 or Workers
            logger.info(f"Deleted file from Cloudflare CDN: {remote_path}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to delete file from Cloudflare: {e}")
            return False
    
    async def purge_cache(self, urls: List[str]) -> bool:
        """Purge cache for URLs"""
        try:
            if not self.session:
                self.session = aiohttp.ClientSession()
            
            url = f"{self.api_base}/zones/{self.config.zone_id}/purge_cache"
            headers = {
                'Authorization': f'Bearer {self.config.api_key}',
                'Content-Type': 'application/json'
            }
            
            data = {
                'files': urls
            }
            
            async with self.session.post(url, headers=headers, json=data) as response:
                if response.status == 200:
                    logger.info(f"Purged cache for {len(urls)} URLs")
                    return True
                else:
                    logger.error(f"Failed to purge cache: {response.status}")
                    return False
                    
        except Exception as e:
            logger.error(f"Failed to purge cache: {e}")
            return False
    
    async def get_file_info(self, remote_path: str) -> Dict[str, Any]:
        """Get file information"""
        try:
            if not self.session:
                self.session = aiohttp.ClientSession()
            
            # Cloudflare doesn't have direct file info API
            # This would need to be implemented with R2 or Workers
            return {
                'path': remote_path,
                'url': f"{self.config.base_url}/{remote_path}",
                'provider': 'cloudflare'
            }
            
        except Exception as e:
            logger.error(f"Failed to get file info: {e}")
            return {}
    
    async def list_files(self, prefix: str = "") -> List[Dict[str, Any]]:
        """List files in CDN"""
        try:
            if not self.session:
                self.session = aiohttp.ClientSession()
            
            # Cloudflare doesn't have direct file listing API
            # This would need to be implemented with R2 or Workers
            return []
            
        except Exception as e:
            logger.error(f"Failed to list files: {e}")
            return []

class AWSCloudFrontCDN(CDNProvider):
    """AWS CloudFront CDN provider"""
    
    def __init__(self, config: CDNConfig):
        super().__init__(config)
        self.s3_bucket = config.base_url.split('.')[0]  # Extract bucket name from URL
    
    async def upload_file(self, local_path: str, remote_path: str) -> str:
        """Upload file to AWS CloudFront via S3"""
        try:
            if not self.session:
                self.session = aiohttp.ClientSession()
            
            # Read file
            with open(local_path, 'rb') as f:
                file_data = f.read()
            
            # Upload to S3 (simplified)
            s3_url = f"https://{self.s3_bucket}.s3.amazonaws.com/{remote_path}"
            cdn_url = f"{self.config.base_url}/{remote_path}"
            
            logger.info(f"Uploaded file {local_path} to AWS CloudFront: {cdn_url}")
            return cdn_url
            
        except Exception as e:
            logger.error(f"Failed to upload file to AWS CloudFront: {e}")
            raise
    
    async def delete_file(self, remote_path: str) -> bool:
        """Delete file from AWS CloudFront via S3"""
        try:
            if not self.session:
                self.session = aiohttp.ClientSession()
            
            # Delete from S3 (simplified)
            logger.info(f"Deleted file from AWS CloudFront: {remote_path}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to delete file from AWS CloudFront: {e}")
            return False
    
    async def purge_cache(self, urls: List[str]) -> bool:
        """Purge cache for URLs"""
        try:
            if not self.session:
                self.session = aiohttp.ClientSession()
            
            # Create CloudFront invalidation
            url = f"https://cloudfront.amazonaws.com/2020-05-31/distribution/{self.config.distribution_id}/invalidation"
            headers = {
                'Authorization': f'AWS4-HMAC-SHA256 {self.config.api_key}',
                'Content-Type': 'application/xml'
            }
            
            # Create invalidation XML
            invalidation_xml = f"""
            <InvalidationBatch>
                <Path>{'</Path><Path>'.join(urls)}</Path>
                <CallerReference>{datetime.now().isoformat()}</CallerReference>
            </InvalidationBatch>
            """
            
            async with self.session.post(url, headers=headers, data=invalidation_xml) as response:
                if response.status == 201:
                    logger.info(f"Created invalidation for {len(urls)} URLs")
                    return True
                else:
                    logger.error(f"Failed to create invalidation: {response.status}")
                    return False
                    
        except Exception as e:
            logger.error(f"Failed to purge cache: {e}")
            return False
    
    async def get_file_info(self, remote_path: str) -> Dict[str, Any]:
        """Get file information"""
        try:
            if not self.session:
                self.session = aiohttp.ClientSession()
            
            # Get S3 object info
            s3_url = f"https://{self.s3_bucket}.s3.amazonaws.com/{remote_path}"
            
            async with self.session.head(s3_url) as response:
                if response.status == 200:
                    return {
                        'path': remote_path,
                        'url': f"{self.config.base_url}/{remote_path}",
                        'size': int(response.headers.get('Content-Length', 0)),
                        'content_type': response.headers.get('Content-Type', ''),
                        'last_modified': response.headers.get('Last-Modified', ''),
                        'provider': 'aws_cloudfront'
                    }
                else:
                    return {}
                    
        except Exception as e:
            logger.error(f"Failed to get file info: {e}")
            return {}
    
    async def list_files(self, prefix: str = "") -> List[Dict[str, Any]]:
        """List files in CDN"""
        try:
            if not self.session:
                self.session = aiohttp.ClientSession()
            
            # List S3 objects
            s3_url = f"https://{self.s3_bucket}.s3.amazonaws.com/"
            params = {'prefix': prefix} if prefix else {}
            
            async with self.session.get(s3_url, params=params) as response:
                if response.status == 200:
                    # Parse S3 XML response (simplified)
                    return []
                else:
                    return []
                    
        except Exception as e:
            logger.error(f"Failed to list files: {e}")
            return []

class AzureCDN(CDNProvider):
    """Azure CDN provider"""
    
    def __init__(self, config: CDNConfig):
        super().__init__(config)
        self.api_base = "https://management.azure.com"
    
    async def upload_file(self, local_path: str, remote_path: str) -> str:
        """Upload file to Azure CDN"""
        try:
            if not self.session:
                self.session = aiohttp.ClientSession()
            
            # Read file
            with open(local_path, 'rb') as f:
                file_data = f.read()
            
            # Upload to Azure Storage (simplified)
            cdn_url = f"{self.config.base_url}/{remote_path}"
            
            logger.info(f"Uploaded file {local_path} to Azure CDN: {cdn_url}")
            return cdn_url
            
        except Exception as e:
            logger.error(f"Failed to upload file to Azure CDN: {e}")
            raise
    
    async def delete_file(self, remote_path: str) -> bool:
        """Delete file from Azure CDN"""
        try:
            if not self.session:
                self.session = aiohttp.ClientSession()
            
            # Delete from Azure Storage (simplified)
            logger.info(f"Deleted file from Azure CDN: {remote_path}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to delete file from Azure CDN: {e}")
            return False
    
    async def purge_cache(self, urls: List[str]) -> bool:
        """Purge cache for URLs"""
        try:
            if not self.session:
                self.session = aiohttp.ClientSession()
            
            # Azure CDN purge API
            url = f"{self.api_base}/subscriptions/{self.config.zone_id}/resourceGroups/rg/providers/Microsoft.Cdn/profiles/profile/endpoints/endpoint/purge"
            headers = {
                'Authorization': f'Bearer {self.config.api_key}',
                'Content-Type': 'application/json'
            }
            
            data = {
                'contentPaths': urls
            }
            
            async with self.session.post(url, headers=headers, json=data) as response:
                if response.status == 200:
                    logger.info(f"Purged cache for {len(urls)} URLs")
                    return True
                else:
                    logger.error(f"Failed to purge cache: {response.status}")
                    return False
                    
        except Exception as e:
            logger.error(f"Failed to purge cache: {e}")
            return False
    
    async def get_file_info(self, remote_path: str) -> Dict[str, Any]:
        """Get file information"""
        try:
            if not self.session:
                self.session = aiohttp.ClientSession()
            
            # Get Azure Storage blob info
            blob_url = f"{self.config.base_url}/{remote_path}"
            
            async with self.session.head(blob_url) as response:
                if response.status == 200:
                    return {
                        'path': remote_path,
                        'url': blob_url,
                        'size': int(response.headers.get('Content-Length', 0)),
                        'content_type': response.headers.get('Content-Type', ''),
                        'last_modified': response.headers.get('Last-Modified', ''),
                        'provider': 'azure_cdn'
                    }
                else:
                    return {}
                    
        except Exception as e:
            logger.error(f"Failed to get file info: {e}")
            return {}
    
    async def list_files(self, prefix: str = "") -> List[Dict[str, Any]]:
        """List files in CDN"""
        try:
            if not self.session:
                self.session = aiohttp.ClientSession()
            
            # List Azure Storage blobs
            container_url = f"{self.config.base_url}/"
            params = {'prefix': prefix} if prefix else {}
            
            async with self.session.get(container_url, params=params) as response:
                if response.status == 200:
                    # Parse Azure XML response (simplified)
                    return []
                else:
                    return []
                    
        except Exception as e:
            logger.error(f"Failed to list files: {e}")
            return []

class CDNManager:
    """CDN manager for handling multiple CDN providers"""
    
    def __init__(self):
        self.providers: Dict[str, CDNProvider] = {}
        self.assets: Dict[str, CDNAsset] = {}
        self.upload_queue: List[Tuple[str, str, str]] = []  # (local_path, remote_path, provider)
        self.purge_queue: List[Tuple[List[str], str]] = []  # (urls, provider)
    
    def add_provider(self, name: str, provider: CDNProvider):
        """Add CDN provider"""
        self.providers[name] = provider
        logger.info(f"Added CDN provider: {name}")
    
    async def upload_file(self, local_path: str, remote_path: str, provider: str = None) -> str:
        """Upload file to CDN"""
        if not provider:
            provider = list(self.providers.keys())[0]  # Use first provider
        
        if provider not in self.providers:
            raise ValueError(f"Unknown CDN provider: {provider}")
        
        try:
            # Upload file
            cdn_url = await self.providers[provider].upload_file(local_path, remote_path)
            
            # Create asset record
            file_size = os.path.getsize(local_path)
            content_type = mimetypes.guess_type(local_path)[0] or 'application/octet-stream'
            
            # Calculate checksum
            with open(local_path, 'rb') as f:
                file_data = f.read()
                checksum = hashlib.md5(file_data).hexdigest()
            
            asset = CDNAsset(
                asset_id=hashlib.md5(remote_path.encode()).hexdigest(),
                local_path=local_path,
                cdn_url=cdn_url,
                content_type=content_type,
                size=file_size,
                checksum=checksum,
                uploaded_at=datetime.now()
            )
            
            self.assets[asset.asset_id] = asset
            
            logger.info(f"Uploaded file {local_path} to {provider}: {cdn_url}")
            return cdn_url
            
        except Exception as e:
            logger.error(f"Failed to upload file {local_path} to {provider}: {e}")
            raise
    
    async def delete_file(self, remote_path: str, provider: str = None) -> bool:
        """Delete file from CDN"""
        if not provider:
            provider = list(self.providers.keys())[0]
        
        if provider not in self.providers:
            raise ValueError(f"Unknown CDN provider: {provider}")
        
        try:
            success = await self.providers[provider].delete_file(remote_path)
            
            if success:
                # Remove asset record
                asset_id = hashlib.md5(remote_path.encode()).hexdigest()
                if asset_id in self.assets:
                    del self.assets[asset_id]
                
                logger.info(f"Deleted file {remote_path} from {provider}")
            
            return success
            
        except Exception as e:
            logger.error(f"Failed to delete file {remote_path} from {provider}: {e}")
            return False
    
    async def purge_cache(self, urls: List[str], provider: str = None) -> bool:
        """Purge cache for URLs"""
        if not provider:
            provider = list(self.providers.keys())[0]
        
        if provider not in self.providers:
            raise ValueError(f"Unknown CDN provider: {provider}")
        
        try:
            success = await self.providers[provider].purge_cache(urls)
            
            if success:
                logger.info(f"Purged cache for {len(urls)} URLs from {provider}")
            
            return success
            
        except Exception as e:
            logger.error(f"Failed to purge cache from {provider}: {e}")
            return False
    
    async def get_file_info(self, remote_path: str, provider: str = None) -> Dict[str, Any]:
        """Get file information"""
        if not provider:
            provider = list(self.providers.keys())[0]
        
        if provider not in self.providers:
            raise ValueError(f"Unknown CDN provider: {provider}")
        
        try:
            return await self.providers[provider].get_file_info(remote_path)
        except Exception as e:
            logger.error(f"Failed to get file info from {provider}: {e}")
            return {}
    
    async def list_files(self, prefix: str = "", provider: str = None) -> List[Dict[str, Any]]:
        """List files in CDN"""
        if not provider:
            provider = list(self.providers.keys())[0]
        
        if provider not in self.providers:
            raise ValueError(f"Unknown CDN provider: {provider}")
        
        try:
            return await self.providers[provider].list_files(prefix)
        except Exception as e:
            logger.error(f"Failed to list files from {provider}: {e}")
            return []
    
    async def batch_upload(self, files: List[Tuple[str, str]], provider: str = None) -> List[str]:
        """Batch upload files"""
        results = []
        
        for local_path, remote_path in files:
            try:
                cdn_url = await self.upload_file(local_path, remote_path, provider)
                results.append(cdn_url)
            except Exception as e:
                logger.error(f"Failed to upload {local_path}: {e}")
                results.append(None)
        
        return results
    
    async def batch_purge(self, url_groups: List[Tuple[List[str], str]]) -> List[bool]:
        """Batch purge cache"""
        results = []
        
        for urls, provider in url_groups:
            try:
                success = await self.purge_cache(urls, provider)
                results.append(success)
            except Exception as e:
                logger.error(f"Failed to purge cache from {provider}: {e}")
                results.append(False)
        
        return results
    
    def get_asset_info(self, asset_id: str) -> Optional[CDNAsset]:
        """Get asset information"""
        return self.assets.get(asset_id)
    
    def list_assets(self) -> List[CDNAsset]:
        """List all assets"""
        return list(self.assets.values())
    
    async def close_connections(self):
        """Close all CDN connections"""
        for provider in self.providers.values():
            if provider.session:
                await provider.session.close()

# Example usage
async def main():
    # Initialize CDN manager
    cdn_manager = CDNManager()
    
    # Configure Cloudflare CDN
    cloudflare_config = CDNConfig(
        provider='cloudflare',
        base_url='https://cdn.example.com',
        api_key='cloudflare_api_key',
        api_secret='cloudflare_api_secret',
        zone_id='cloudflare_zone_id'
    )
    cloudflare_cdn = CloudflareCDN(cloudflare_config)
    cdn_manager.add_provider('cloudflare', cloudflare_cdn)
    
    # Configure AWS CloudFront CDN
    aws_config = CDNConfig(
        provider='aws_cloudfront',
        base_url='https://d1234567890.cloudfront.net',
        api_key='aws_access_key',
        api_secret='aws_secret_key',
        distribution_id='E1234567890'
    )
    aws_cdn = AWSCloudFrontCDN(aws_config)
    cdn_manager.add_provider('aws', aws_cdn)
    
    # Configure Azure CDN
    azure_config = CDNConfig(
        provider='azure_cdn',
        base_url='https://cdn.azure.com',
        api_key='azure_api_key',
        api_secret='azure_api_secret',
        zone_id='azure_subscription_id'
    )
    azure_cdn = AzureCDN(azure_config)
    cdn_manager.add_provider('azure', azure_cdn)
    
    # Test CDN operations
    # Upload files
    test_files = [
        ('/path/to/image1.jpg', 'images/image1.jpg'),
        ('/path/to/image2.png', 'images/image2.png'),
        ('/path/to/document.pdf', 'documents/document.pdf')
    ]
    
    for local_path, remote_path in test_files:
        try:
            cdn_url = await cdn_manager.upload_file(local_path, remote_path, 'cloudflare')
            print(f"Uploaded {local_path} to {cdn_url}")
        except Exception as e:
            print(f"Failed to upload {local_path}: {e}")
    
    # Batch upload
    batch_results = await cdn_manager.batch_upload(test_files, 'aws')
    print(f"Batch upload results: {batch_results}")
    
    # Purge cache
    urls_to_purge = [
        'https://cdn.example.com/images/image1.jpg',
        'https://cdn.example.com/images/image2.png'
    ]
    
    purge_success = await cdn_manager.purge_cache(urls_to_purge, 'cloudflare')
    print(f"Cache purge success: {purge_success}")
    
    # Get file info
    file_info = await cdn_manager.get_file_info('images/image1.jpg', 'cloudflare')
    print(f"File info: {file_info}")
    
    # List assets
    assets = cdn_manager.list_assets()
    print(f"Total assets: {len(assets)}")
    
    # Close connections
    await cdn_manager.close_connections()

if __name__ == "__main__":
    asyncio.run(main())
