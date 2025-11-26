// Analytics Query Management Module
import { AnalyticsQuery, QueryParameter, QueryMetadata } from './types';
import { Metadata } from '@/types/metadata';
import { logger } from '../logger';

export class QueryManager {
  private queries: Map<string, AnalyticsQuery> = new Map();

  async loadQueries(): Promise<void> {
    try {
      const saved = localStorage.getItem('bi_queries');
      if (saved) {
        const queries = JSON.parse(saved) as AnalyticsQuery[];
        queries.forEach((query) => {
          this.queries.set(query.id, {
            ...query,
            createdAt: new Date(query.createdAt),
            updatedAt: new Date(query.updatedAt),
          });
        });
      }
    } catch (error) {
      logger.error('Failed to load queries:', error);
    }
  }

  async saveQueries(): Promise<void> {
    try {
      const queries = Array.from(this.queries.values());
      localStorage.setItem('bi_queries', JSON.stringify(queries));
    } catch (error) {
      logger.error('Failed to save queries:', error);
    }
  }

  async createQuery(
    query: Omit<AnalyticsQuery, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    const id = `query-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();

    const analyticsQuery: AnalyticsQuery = {
      ...query,
      id,
      createdAt: now,
      updatedAt: now,
    };

    this.queries.set(id, analyticsQuery);
    await this.saveQueries();

    return id;
  }

  async updateQuery(id: string, updates: Partial<AnalyticsQuery>): Promise<void> {
    const query = this.queries.get(id);
    if (!query) {
      throw new Error(`Query ${id} not found`);
    }

    const updatedQuery = {
      ...query,
      ...updates,
      updatedAt: new Date(),
    };

    this.queries.set(id, updatedQuery);
    await this.saveQueries();
  }

  async deleteQuery(id: string): Promise<void> {
    const query = this.queries.get(id);
    if (!query) {
      throw new Error(`Query ${id} not found`);
    }

    this.queries.delete(id);
    await this.saveQueries();
  }

  getQuery(id: string): AnalyticsQuery | undefined {
    return this.queries.get(id);
  }

  getAllQueries(): AnalyticsQuery[] {
    return Array.from(this.queries.values());
  }

  async executeQuery(
    id: string,
    queryExecutor: (
      query: AnalyticsQuery,
      parameters?: Metadata
    ) => Promise<Array<Record<string, unknown>>>,
    parameters?: Metadata
  ): Promise<Array<Record<string, unknown>>> {
    const query = this.queries.get(id);
    if (!query) {
      throw new Error(`Query ${id} not found`);
    }

    try {
      const startTime = Date.now();
      const result = await queryExecutor(query, parameters);
      const executionTime = Date.now() - startTime;

      query.metadata.executionCount++;
      query.metadata.averageExecutionTime =
        (query.metadata.averageExecutionTime * (query.metadata.executionCount - 1) +
          executionTime) /
        query.metadata.executionCount;

      await this.saveQueries();

      return result;
    } catch (error) {
      logger.error(`Query execution failed for ${id}:`, error);
      throw error;
    }
  }
}
