/**
 * Security Features
 * 
 * Features related to authentication, authorization, and data security
 */

import { registerFeature } from '../registry';

// Authentication Feature
registerFeature({
  id: 'security:authentication',
  name: 'Authentication',
  description: 'User authentication and session management',
  category: 'security',
  status: 'active',
  version: '1.0.0',
  actions: [
    {
      id: 'login',
      name: 'Login',
      description: 'Authenticate user',
      parameters: [
        { name: 'email', type: 'string', required: true },
        { name: 'password', type: 'string', required: true },
      ],
      requiresApproval: false,
    },
    {
      id: 'logout',
      name: 'Logout',
      description: 'End user session',
    },
  ],
  frenlyIntegration: {
    providesGuidance: false, // Security features don't need Frenly guidance
  },
  metaAgentIntegration: {
    monitorable: true,
    executable: false,
    compatibleAgents: ['monitoring'],
    events: [
      { name: 'auth.login.success', description: 'User successfully logged in' },
      { name: 'auth.login.failed', description: 'Login attempt failed' },
    ],
  },
});

// Password Management Feature
registerFeature({
  id: 'security:password-management',
  name: 'Password Management',
  description: 'Secure password storage and rotation',
  category: 'security',
  status: 'active',
  version: '1.0.0',
  actions: [
    {
      id: 'rotate-password',
      name: 'Rotate Password',
      description: 'Rotate a stored password',
      parameters: [
        { name: 'passwordId', type: 'string', required: true },
      ],
      requiresApproval: true,
    },
  ],
  metaAgentIntegration: {
    monitorable: true,
    executable: true,
    compatibleAgents: ['monitoring', 'remediation'],
  },
});

