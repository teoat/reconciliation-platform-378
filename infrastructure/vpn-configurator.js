// ============================================================================
// VPN CONFIGURATION AUTOMATION - Infrastructure Automation
// ============================================================================

class VPNConfigurator {
  constructor() {
    this.templates = new Map();
    this.configurations = new Map();
    this.certificates = new Map();
    this.isActive = false;
  }

  // Initialize the VPN configurator
  async initialize() {
    console.log('🔐 Initializing VPN Configurator...');

    this.loadVPNTemplates();
    this.isActive = true;
    console.log('✅ VPN Configurator activated');
  }

  // Load VPN templates
  loadVPNTemplates() {
    // OpenVPN Template
    this.templates.set('openvpn', {
      name: 'OpenVPN Server',
      type: 'openvpn',
      dockerfile: `# OpenVPN Server Dockerfile
FROM ubuntu:20.04

# Install OpenVPN and dependencies
RUN apt-get update && apt-get install -y \\
    openvpn \\
    easy-rsa \\
    iptables \\
    && rm -rf /var/lib/apt/lists/*

# Create OpenVPN directory
RUN mkdir -p /etc/openvpn

# Copy configuration and scripts
COPY server.conf /etc/openvpn/
COPY ccd/ /etc/openvpn/ccd/
COPY scripts/ /etc/openvpn/scripts/

# Create tun device
RUN mkdir -p /dev/net && \\
    mknod /dev/net/tun c 10 200 && \\
    chmod 600 /dev/net/tun

EXPOSE 1194/udp

# Health check
HEALTHCHECK --interval=60s --timeout=10s --start-period=30s --retries=3 \\
  CMD nc -z -u 127.0.0.1 1194 || exit 1

CMD ["openvpn", "--config", "/etc/openvpn/server.conf"]
`,
      serverConfig: `# OpenVPN Server Configuration
port 1194
proto udp
dev tun

ca /etc/openvpn/pki/ca.crt
cert /etc/openvpn/pki/server.crt
key /etc/openvpn/pki/server.key
dh /etc/openvpn/pki/dh.pem

server 10.8.0.0 255.255.255.0
ifconfig-pool-persist ipp.txt

push "redirect-gateway def1 bypass-dhcp"
push "dhcp-option DNS 8.8.8.8"
push "dhcp-option DNS 8.8.4.4"

client-config-dir ccd
route 10.8.0.0 255.255.255.0

keepalive 10 120
cipher AES-256-CBC
auth SHA256

user nobody
group nogroup
persist-key
persist-tun

status openvpn-status.log
log-append openvpn.log
verb 3
`,
      clientConfig: `# OpenVPN Client Configuration
client
dev tun
proto udp
remote {SERVER_IP} 1194

resolv-retry infinite
nobind

persist-key
persist-tun

ca ca.crt
cert client.crt
key client.key

remote-cert-tls server
cipher AES-256-CBC
auth SHA256

verb 3
`,
    });

    // WireGuard Template
    this.templates.set('wireguard', {
      name: 'WireGuard VPN',
      type: 'wireguard',
      dockerfile: `# WireGuard Server Dockerfile
FROM linuxserver/wireguard:latest

# Copy configuration
COPY wg0.conf /config/wg0.conf

EXPOSE 51820/udp

# Health check
HEALTHCHECK --interval=60s --timeout=10s --start-period=30s --retries=3 \\
  CMD wg show wg0 || exit 1
`,
      serverConfig: `# WireGuard Server Configuration
[Interface]
Address = 10.0.0.1/24
ListenPort = 51820
PrivateKey = {SERVER_PRIVATE_KEY}
PostUp = iptables -A FORWARD -i wg0 -j ACCEPT; iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
PostDown = iptables -D FORWARD -i wg0 -j ACCEPT; iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE

# Client configurations will be added here
`,
      clientConfig: `# WireGuard Client Configuration
[Interface]
Address = {CLIENT_IP}/24
PrivateKey = {CLIENT_PRIVATE_KEY}
DNS = 8.8.8.8

[Peer]
PublicKey = {SERVER_PUBLIC_KEY}
Endpoint = {SERVER_IP}:51820
AllowedIPs = 0.0.0.0/0
PersistentKeepalive = 25
`,
    });

    // IPSec/L2TP Template
    this.templates.set('ipsec', {
      name: 'IPSec/L2TP VPN',
      type: 'ipsec',
      dockerfile: `# IPSec/L2TP Server Dockerfile
FROM hwdsl2/ipsec-vpn-server:latest

# Copy configuration
COPY vpn.env /opt/src/vpn.env

EXPOSE 500/udp 4500/udp 1701/udp

# Health check
HEALTHCHECK --interval=60s --timeout=10s --start-period=60s --retries=3 \\
  CMD ipsec status || exit 1
`,
      serverConfig: `# IPSec/L2TP Configuration
VPN_IPSEC_PSK={PSK}
VPN_USER={USERNAME}
VPN_PASSWORD={PASSWORD}
VPN_ADDL_USERS=user2 pass2
VPN_ADDL_USERS=user3 pass3
`,
    });

    // ZeroTier Template
    this.templates.set('zerotier', {
      name: 'ZeroTier Network',
      type: 'zerotier',
      dockerfile: `# ZeroTier Docker Container
FROM ubuntu:20.04

# Install ZeroTier
RUN apt-get update && apt-get install -y \\
    curl \\
    gnupg \\
    && curl -s https://install.zerotier.com | bash \\
    && rm -rf /var/lib/apt/lists/*

# Copy identity files
COPY identity.public /var/lib/zerotier-one/identity.public
COPY identity.secret /var/lib/zerotier-one/identity.secret

EXPOSE 9993/udp

# Health check
HEALTHCHECK --interval=60s --timeout=10s --start-period=30s --retries=3 \\
  CMD zerotier-cli info || exit 1

CMD ["zerotier-one"]
`,
    });
  }

  // Generate VPN configuration
  async generateVPNConfig(vpnType, config) {
    const {
      networkName,
      serverIP,
      clientCount = 1,
      networkCIDR = '10.8.0.0/24',
      dnsServers = ['8.8.8.8', '8.8.4.4'],
    } = config;

    console.log(`🔐 Generating ${vpnType} configuration for ${networkName}`);

    const template = this.templates.get(vpnType);
    if (!template) {
      throw new Error(`Unknown VPN type: ${vpnType}`);
    }

    const vpnConfig = {
      type: vpnType,
      networkName,
      serverIP,
      networkCIDR,
      dnsServers,
      clients: [],
      certificates: {},
      dockerfile: template.dockerfile,
      generatedAt: new Date().toISOString(),
    };

    // Generate server configuration
    vpnConfig.serverConfig = await this.generateServerConfig(template, config);

    // Generate client configurations
    for (let i = 1; i <= clientCount; i++) {
      const clientConfig = await this.generateClientConfig(template, config, i);
      vpnConfig.clients.push(clientConfig);
    }

    // Generate certificates/keys if needed
    if (this.needsCertificates(vpnType)) {
      vpnConfig.certificates = await this.generateCertificates(vpnType, config);
    }

    this.configurations.set(networkName, vpnConfig);
    console.log(`✅ Generated VPN configuration for ${networkName}`);

    return vpnConfig;
  }

  // Generate server configuration
  async generateServerConfig(template, config) {
    let serverConfig = template.serverConfig;

    // Replace placeholders
    serverConfig = serverConfig.replace('{SERVER_IP}', config.serverIP || '0.0.0.0');
    serverConfig = serverConfig.replace('{PSK}', this.generatePSK());
    serverConfig = serverConfig.replace('{USERNAME}', config.username || 'vpnuser');
    serverConfig = serverConfig.replace('{PASSWORD}', config.password || this.generatePassword());

    // Generate keys for WireGuard
    if (template.type === 'wireguard') {
      const keys = await this.generateWireGuardKeys();
      serverConfig = serverConfig.replace('{SERVER_PRIVATE_KEY}', keys.privateKey);
    }

    return serverConfig;
  }

  // Generate client configuration
  async generateClientConfig(template, config, clientIndex) {
    let clientConfig = template.clientConfig;

    // Replace placeholders
    clientConfig = clientConfig.replace('{SERVER_IP}', config.serverIP);
    clientConfig = clientConfig.replace('{CLIENT_IP}', `10.8.0.${clientIndex + 1}`);

    // Generate client-specific keys
    if (template.type === 'wireguard') {
      const serverKeys = await this.generateWireGuardKeys();
      const clientKeys = await this.generateWireGuardKeys();

      clientConfig = clientConfig.replace('{CLIENT_PRIVATE_KEY}', clientKeys.privateKey);
      clientConfig = clientConfig.replace('{SERVER_PUBLIC_KEY}', serverKeys.publicKey);
    }

    return {
      name: `client${clientIndex}`,
      config: clientConfig,
      index: clientIndex,
    };
  }

  // Generate certificates for VPN
  async generateCertificates(vpnType, config) {
    const certificates = {};

    switch (vpnType) {
      case 'openvpn':
        certificates.ca = await this.generateCACertificate();
        certificates.server = await this.generateServerCertificate();
        certificates.clients = [];

        for (let i = 1; i <= (config.clientCount || 1); i++) {
          certificates.clients.push(await this.generateClientCertificate(`client${i}`));
        }
        break;

      case 'wireguard':
        // WireGuard uses keys instead of certificates
        certificates.serverKeys = await this.generateWireGuardKeys();
        certificates.clientKeys = [];

        for (let i = 1; i <= (config.clientCount || 1); i++) {
          certificates.clientKeys.push(await this.generateWireGuardKeys());
        }
        break;
    }

    return certificates;
  }

  // Check if VPN type needs certificates
  needsCertificates(vpnType) {
    return ['openvpn', 'ipsec'].includes(vpnType);
  }

  // Generate CA certificate
  async generateCACertificate() {
    // Simulate certificate generation
    return {
      cert: `-----BEGIN CERTIFICATE-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...
-----END CERTIFICATE-----`,
      key: `-----BEGIN PRIVATE KEY-----
MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQg...
-----END PRIVATE KEY-----`,
    };
  }

  // Generate server certificate
  async generateServerCertificate() {
    // Simulate certificate generation
    return {
      cert: `-----BEGIN CERTIFICATE-----
MIICiTCCAg+gAwIBAgIJAJ8l2Z2Z3Z3ZMAOGA1UEBhMC...
-----END CERTIFICATE-----`,
      key: `-----BEGIN PRIVATE KEY-----
MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQg...
-----END PRIVATE KEY-----`,
    };
  }

  // Generate client certificate
  async generateClientCertificate(clientName) {
    // Simulate certificate generation
    return {
      name: clientName,
      cert: `-----BEGIN CERTIFICATE-----
MIICiTCCAg+gAwIBAgIJAJ8l2Z2Z3Z3ZMAOGA1UEBhMC...
-----END CERTIFICATE-----`,
      key: `-----BEGIN PRIVATE KEY-----
MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQg...
-----END PRIVATE KEY-----`,
    };
  }

  // Generate WireGuard keys
  async generateWireGuardKeys() {
    // Simulate key generation (in real implementation, use wg genkey/wg pubkey)
    const privateKey = this.generateRandomKey(32);
    const publicKey = this.generateRandomKey(32); // Simplified - real implementation would derive public key

    return {
      privateKey,
      publicKey,
    };
  }

  // Generate PSK
  generatePSK() {
    return this.generateRandomString(32);
  }

  // Generate password
  generatePassword() {
    return this.generateRandomString(16);
  }

  // Generate random key
  generateRandomKey(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // Generate random string
  generateRandomString(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // Generate docker-compose configuration for VPN
  async generateVPNDockerCompose(vpnConfigs) {
    console.log('🐳 Generating docker-compose.yml for VPN services');

    const composeConfig = {
      version: '3.8',
      services: {},
      networks: {
        vpn_network: {
          driver: 'bridge',
          ipam: {
            config: [
              {
                subnet: '10.8.0.0/16',
              },
            ],
          },
        },
      },
    };

    for (const vpnConfig of vpnConfigs) {
      const serviceName = `${vpnConfig.networkName}-vpn`;
      composeConfig.services[serviceName] = {
        build: {
          context: '.',
          dockerfile: `Dockerfile.${serviceName}`,
        },
        container_name: serviceName,
        cap_add: ['NET_ADMIN', 'SYS_MODULE'],
        sysctls: {
          'net.ipv4.ip_forward': 1,
          'net.ipv4.conf.all.src_valid_mark': 1,
        },
        ports: this.getVPNPorts(vpnConfig.type),
        volumes: [`./vpn/${vpnConfig.networkName}:/etc/openvpn`, '/lib/modules:/lib/modules:ro'],
        networks: ['vpn_network'],
        restart: 'unless-stopped',
        environment: this.getVPNEnvironment(vpnConfig),
      };

      // Add VPN-specific configuration
      if (vpnConfig.type === 'wireguard') {
        composeConfig.services[serviceName].devices = ['/dev/net/tun:/dev/net/tun'];
        composeConfig.services[serviceName].volumes = [
          `./vpn/${vpnConfig.networkName}:/config`,
          '/lib/modules:/lib/modules:ro',
        ];
      }
    }

    const yamlContent = this.convertToYAML(composeConfig);
    console.log('✅ Generated VPN docker-compose.yml');

    return yamlContent;
  }

  // Get VPN ports
  getVPNPorts(vpnType) {
    const portMappings = {
      openvpn: ['1194:1194/udp'],
      wireguard: ['51820:51820/udp'],
      ipsec: ['500:500/udp', '4500:4500/udp', '1701:1701/udp'],
      zerotier: ['9993:9993/udp'],
    };

    return portMappings[vpnType] || [];
  }

  // Get VPN environment variables
  getVPNEnvironment(vpnConfig) {
    const envVars = [];

    switch (vpnConfig.type) {
      case 'ipsec':
        envVars.push('VPN_IPSEC_PSK=${VPN_IPSEC_PSK}');
        envVars.push('VPN_USER=${VPN_USER}');
        envVars.push('VPN_PASSWORD=${VPN_PASSWORD}');
        break;
    }

    return envVars;
  }

  // Convert configuration to YAML
  convertToYAML(obj, indent = 0) {
    const spaces = ' '.repeat(indent * 2);
    let yaml = '';

    for (const [key, value] of Object.entries(obj)) {
      if (Array.isArray(value)) {
        yaml += `${spaces}${key}:\n`;
        value.forEach((item) => {
          if (typeof item === 'object') {
            yaml += `${spaces}  - ${this.convertToYAML(item, indent + 1).trim()}\n`;
          } else {
            yaml += `${spaces}  - ${item}\n`;
          }
        });
      } else if (typeof value === 'object' && value !== null) {
        yaml += `${spaces}${key}:\n`;
        yaml += this.convertToYAML(value, indent + 1);
      } else {
        yaml += `${spaces}${key}: ${value}\n`;
      }
    }

    return yaml;
  }

  // Generate VPN deployment scripts
  async generateVPNDeploymentScripts(vpnConfigs, outputDir = './infrastructure/vpn/generated') {
    console.log('📜 Generating VPN deployment scripts');

    const scripts = [];

    // Setup script
    const setupScript = `#!/bin/bash
# VPN Infrastructure Setup Script
echo "Setting up VPN infrastructure..."

# Create necessary directories
${vpnConfigs
  .map(
    (config) => `mkdir -p vpn/${config.networkName}/ccd
mkdir -p vpn/${config.networkName}/scripts`
  )
  .join('\n')}

# Generate certificates and keys
echo "Generating certificates and keys..."
${vpnConfigs.map((config) => this.generateCertCommands(config)).join('\n')}

echo "VPN infrastructure setup complete!"
`;

    await this.writeFile(`${outputDir}/setup-vpn.sh`, setupScript);
    scripts.push('setup-vpn.sh');

    // Deploy script
    const deployScript = `#!/bin/bash
# VPN Deployment Script
echo "Deploying VPN services..."

# Load environment variables
if [ -f .env ]; then
  export $(cat .env | xargs)
fi

# Build and start VPN services
docker-compose -f docker-compose.vpn.yml up -d --build

# Wait for services to be ready
echo "Waiting for VPN services to be ready..."
sleep 30

# Show status
docker-compose -f docker-compose.vpn.yml ps

echo "VPN services deployed successfully!"
echo ""
echo "Client configurations available in ./vpn/ directory"
`;

    await this.writeFile(`${outputDir}/deploy-vpn.sh`, deployScript);
    scripts.push('deploy-vpn.sh');

    // Client configuration script
    const clientScript = `#!/bin/bash
# VPN Client Configuration Script
echo "Configuring VPN clients..."

VPN_TYPE=$1
CLIENT_NAME=$2

if [ -z "$VPN_TYPE" ] || [ -z "$CLIENT_NAME" ]; then
  echo "Usage: $0 <vpn_type> <client_name>"
  echo "Example: $0 openvpn client1"
  exit 1
fi

case $VPN_TYPE in
  "openvpn")
    echo "Configuring OpenVPN client..."
    # Copy client configuration and certificates
    mkdir -p clients/$CLIENT_NAME
    cp vpn/*/clients/$CLIENT_NAME.ovpn clients/$CLIENT_NAME/
    cp vpn/*/pki/ca.crt clients/$CLIENT_NAME/
    cp vpn/*/pki/issued/$CLIENT_NAME.crt clients/$CLIENT_NAME/
    cp vpn/*/pki/private/$CLIENT_NAME.key clients/$CLIENT_NAME/
    ;;
  "wireguard")
    echo "Configuring WireGuard client..."
    # Copy WireGuard configuration
    mkdir -p clients/$CLIENT_NAME
    cp vpn/*/clients/$CLIENT_NAME.conf clients/$CLIENT_NAME/
    ;;
  *)
    echo "Unsupported VPN type: $VPN_TYPE"
    exit 1
    ;;
esac

echo "Client configuration complete for $CLIENT_NAME"
echo "Configuration files available in ./clients/$CLIENT_NAME/"
`;

    await this.writeFile(`${outputDir}/configure-client.sh`, clientScript);
    scripts.push('configure-client.sh');

    return scripts;
  }

  // Generate certificate commands
  generateCertCommands(config) {
    switch (config.type) {
      case 'openvpn':
        return `
# Generate OpenVPN certificates for ${config.networkName}
cd vpn/${config.networkName}
easyrsa init-pki
easyrsa build-ca nopass
easyrsa build-server-full server nopass
easyrsa build-client-full client1 nopass
# Additional client certificates would be generated here
easyrsa gen-dh
openvpn --genkey --secret pki/ta.key
`;
      case 'wireguard':
        return `
# Generate WireGuard keys for ${config.networkName}
cd vpn/${config.networkName}
wg genkey | tee server_private.key | wg pubkey > server_public.key
wg genkey | tee client1_private.key | wg pubkey > client1_public.key
# Additional client keys would be generated here
`;
      default:
        return `# No certificate generation needed for ${config.type}`;
    }
  }

  // Write file (simulated)
  async writeFile(filename, content) {
    console.log(`📝 Writing file: ${filename}`);
    // In a real implementation, this would write to the filesystem
  }

  // Generate complete VPN infrastructure
  async generateVPNInfrastructure(vpnConfigs, outputDir = './infrastructure/vpn/generated') {
    console.log('🏗️ Generating complete VPN infrastructure');

    const results = {
      configurations: [],
      dockerCompose: '',
      scripts: [],
      documentation: '',
    };

    // Generate VPN configurations
    for (const vpnConfig of vpnConfigs) {
      const config = await this.generateVPNConfig(vpnConfig.type, vpnConfig);
      results.configurations.push(config);

      // Write configurations to files
      await this.writeVPNFiles(config, outputDir);
    }

    // Generate docker-compose
    results.dockerCompose = await this.generateVPNDockerCompose(results.configurations);
    await this.writeFile(`${outputDir}/docker-compose.vpn.yml`, results.dockerCompose);

    // Generate deployment scripts
    results.scripts = await this.generateVPNDeploymentScripts(results.configurations, outputDir);

    // Generate documentation
    results.documentation = this.generateVPNDocumentation(results.configurations);

    console.log('✅ Complete VPN infrastructure generated');
    return results;
  }

  // Write VPN configuration files
  async writeVPNFiles(config, outputDir) {
    const baseDir = `${outputDir}/vpn/${config.networkName}`;

    // Write server configuration
    await this.writeFile(`${baseDir}/server.conf`, config.serverConfig);

    // Write client configurations
    for (const client of config.clients) {
      await this.writeFile(`${baseDir}/clients/${client.name}.conf`, client.config);
    }

    // Write certificates
    if (config.certificates.ca) {
      await this.writeFile(`${baseDir}/pki/ca.crt`, config.certificates.ca.cert);
      await this.writeFile(`${baseDir}/pki/ca.key`, config.certificates.ca.key);
    }

    if (config.certificates.server) {
      await this.writeFile(`${baseDir}/pki/server.crt`, config.certificates.server.cert);
      await this.writeFile(`${baseDir}/pki/server.key`, config.certificates.server.key);
    }

    // Write Dockerfile
    await this.writeFile(`${baseDir}/Dockerfile.${config.networkName}-vpn`, config.dockerfile);
  }

  // Generate VPN documentation
  generateVPNDocumentation(configs) {
    const docs = `# VPN Infrastructure Documentation

Generated on: ${new Date().toISOString()}

## VPN Networks

${configs
  .map(
    (config) => `
### ${config.networkName} (${config.type.toUpperCase()})
- **Type**: ${config.type}
- **Network**: ${config.networkCIDR}
- **Server IP**: ${config.serverIP}
- **Clients**: ${config.clients.length}
- **DNS Servers**: ${config.dnsServers.join(', ')}

#### Client Configuration
${config.clients
  .map(
    (client) => `
**${client.name}**:
\`\`\`
${client.config}
\`\`\`
`
  )
  .join('\n')}

#### Ports
${this.getVPNPorts(config.type).join(', ')}

`
  )
  .join('\n')}

## Getting Started

1. **Setup VPN Infrastructure**:
   \`\`\`bash
   ./setup-vpn.sh
   \`\`\`

2. **Deploy VPN Services**:
   \`\`\`bash
   ./deploy-vpn.sh
   \`\`\`

3. **Configure Clients**:
   \`\`\`bash
   ./configure-client.sh <vpn_type> <client_name>
   \`\`\`

## Security Notes

- Change default passwords and PSKs in production
- Use strong certificates and keys
- Implement proper firewall rules
- Regularly rotate certificates
- Monitor VPN access logs

## Troubleshooting

### OpenVPN
- Check logs: \`docker logs <container_name>\`
- Verify certificates are properly generated
- Ensure UDP port 1194 is open

### WireGuard
- Check interface: \`wg show\`
- Verify keys are correct
- Ensure UDP port 51820 is open

### IPSec/L2TP
- Check status: \`ipsec status\`
- Verify PSK and credentials
- Ensure UDP ports 500, 4500, 1701 are open
`;

    return docs;
  }

  // Get configurator status
  getConfiguratorStatus() {
    return {
      isActive: this.isActive,
      availableTemplates: Array.from(this.templates.keys()),
      configurations: Array.from(this.configurations.keys()),
      templateCount: this.templates.size,
    };
  }

  // Stop the configurator
  stop() {
    this.isActive = false;
    console.log('⏹️ VPN Configurator stopped');
  }
}

// Export singleton instance
export const vpnConfigurator = new VPNConfigurator();

// Auto-initialize if running in Node.js environment
if (typeof window === 'undefined') {
  vpnConfigurator.initialize().catch(console.error);
}
