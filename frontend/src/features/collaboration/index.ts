/**
 * Collaboration Features
 * 
 * Features related to real-time collaboration, comments, and team coordination
 */

import { registerFeature } from '../registry';

// Real-time Collaboration Feature
registerFeature({
  id: 'collaboration:realtime',
  name: 'Real-time Collaboration',
  description: 'Real-time collaboration with comments, presence, and live updates',
  category: 'collaboration',
  status: 'active',
  version: '1.0.0',
  actions: [
    {
      id: 'join-session',
      name: 'Join Session',
      description: 'Join a collaboration session',
      parameters: [
        { name: 'sessionId', type: 'string', required: true },
      ],
    },
    {
      id: 'send-comment',
      name: 'Send Comment',
      description: 'Send a comment in collaboration session',
      parameters: [
        { name: 'content', type: 'string', required: true },
        { name: 'targetId', type: 'string', required: false },
      ],
    },
  ],
  frenlyIntegration: {
    providesGuidance: true,
    helpContentIds: ['collaboration-guide'],
    tips: ['Use @mentions to notify team members', 'Resolve comments when addressed'],
  },
  metaAgentIntegration: {
    monitorable: true,
    executable: false,
    compatibleAgents: ['monitoring'],
    events: [
      { name: 'collaboration.session.joined', description: 'User joined collaboration session' },
      { name: 'collaboration.comment.added', description: 'Comment added to session' },
    ],
  },
});

// Re-export components
export { CollaborationPanel } from '../../components/CollaborationPanel';
export { CollaborationDashboard } from '../../components/collaboration/CollaborationDashboard';

