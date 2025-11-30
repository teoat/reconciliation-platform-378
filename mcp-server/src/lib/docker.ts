/**
 * Docker operations for MCP Server
 */

// @ts-ignore
import Docker from 'dockerode';
import { logger } from './logger.js';

// Connection instance (singleton pattern)
let docker: Docker | null = null;

/**
 * Initialize Docker connection
 */
export function initDocker(): Docker | null {
  if (docker) return docker;

  try {
    docker = new Docker();
    // Test connection
    docker.ping().catch(() => {
      docker = null;
    });
    return docker;
  } catch (error) {
    logger.warn('Docker initialization failed', { error: error.message });
    return null;
  }
}

/**
 * Get Docker container status
 */
export async function getContainerStatus(filter: 'all' | 'running' | 'stopped', name?: string) {
  const dockerInstance = initDocker();
  if (!dockerInstance) {
    throw new Error('Docker is not available. Please ensure Docker is running and accessible.');
  }

  try {
    const containers = await dockerInstance.listContainers({ all: filter === 'all' });
    let filtered = containers;

    if (name) {
      filtered = containers.filter((c: any) => c.Names.some((n: string) => n.includes(name)));
    }

    if (filter === 'running') {
      filtered = filtered.filter((c: any) => c.State === 'running');
    } else if (filter === 'stopped') {
      filtered = filtered.filter((c: any) => c.State !== 'running');
    }

    return {
      containers: filtered.map((c: any) => ({
        id: c.Id.substring(0, 12),
        name: c.Names[0]?.replace(/^\//, '') || 'unknown',
        image: c.Image,
        status: c.Status,
        state: c.State,
        ports: c.Ports?.map((p: any) => `${p.PublicPort}:${p.PrivatePort}/${p.Type}`) || [],
      })),
      count: filtered.length,
    };
  } catch (error: any) {
    throw new Error(`Docker operation failed: ${error.message}`);
  }
}

/**
 * Get container logs
 */
export async function getContainerLogs(container: string, tail: number = 100) {
  const dockerInstance = initDocker();
  if (!dockerInstance) {
    throw new Error('Docker is not available. Please ensure Docker is running and accessible.');
  }

  try {
    const containerInstance = dockerInstance.getContainer(container);
    const logs = await containerInstance.logs({
      tail,
      stdout: true,
      stderr: true,
      timestamps: true,
    });

    return {
      logs: logs.toString('utf-8'),
      container,
      lines: tail,
    };
  } catch (error: any) {
    throw new Error(`Failed to get container logs: ${error.message}`);
  }
}

/**
 * Restart container
 */
export async function restartContainer(container: string) {
  const dockerInstance = initDocker();
  if (!dockerInstance) {
    throw new Error('Docker is not available. Please ensure Docker is running and accessible.');
  }

  try {
    const containerInstance = dockerInstance.getContainer(container);
    await containerInstance.restart({ t: 10 }); // 10 second timeout
    const info = await containerInstance.inspect();

    return {
      success: true,
      container,
      status: info.State.Status,
      startedAt: info.State.StartedAt,
    };
  } catch (error: any) {
    throw new Error(`Failed to restart container: ${error.message}`);
  }
}
