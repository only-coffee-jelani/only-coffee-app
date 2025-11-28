import { Injectable, Logger } from '@nestjs/common';
// import { KinesisClient, PutRecordCommand, PutRecordsCommand } from '@aws-sdk/client-kinesis';
import { UserEvent } from '@shared/database/entities';

// Placeholder types for when AWS SDK is not installed
type KinesisClient = any;
type PutRecordCommand = any;
type PutRecordsCommand = any;

interface KinesisRecord {
  Data: string; // Base64 encoded JSON
  PartitionKey: string;
}

@Injectable()
export class KinesisService {
  private readonly logger = new Logger(KinesisService.name);
  private kinesisClient: KinesisClient | null = null;
  private streamName: string;
  private isEnabled: boolean;

  constructor() {
    // Check if Kinesis is enabled via environment variable
    this.isEnabled = process.env.ENABLE_KINESIS === 'true';
    this.streamName = process.env.AWS_KINESIS_STREAM_NAME || 'only-coffee-user-events';

    // TODO: Re-enable when @aws-sdk/client-kinesis is installed
    // For now, always disabled
    this.isEnabled = false;
    this.logger.warn('Kinesis streaming is disabled. AWS SDK not installed.');

    /* Commented out until AWS SDK is installed
    if (this.isEnabled) {
      try {
        this.kinesisClient = new KinesisClient({
          region: process.env.AWS_REGION || 'us-east-1',
          credentials: process.env.AWS_ACCESS_KEY_ID
            ? {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
              }
            : undefined, // Use IAM role if running on EC2/ECS
        });
        this.logger.log(`Kinesis client initialized for stream: ${this.streamName}`);
      } catch (error) {
        this.logger.error('Failed to initialize Kinesis client:', error);
        this.isEnabled = false;
      }
    } else {
      this.logger.warn('Kinesis streaming is disabled. Set ENABLE_KINESIS=true to enable.');
    }
    */
  }

  /**
   * Push a single event to Kinesis Data Stream
   */
  async pushEvent(event: UserEvent): Promise<void> {
    if (!this.isEnabled || !this.kinesisClient) {
      this.logger.debug('Kinesis disabled, skipping event push');
      return;
    }

    /* Commented out until AWS SDK is installed
    try {
      const eventData = this.serializeEvent(event);

      const command = new PutRecordCommand({
        StreamName: this.streamName,
        Data: Buffer.from(JSON.stringify(eventData)),
        PartitionKey: event.userId, // Partition by userId for consistent ordering
      });

      const response = await this.kinesisClient.send(command);

      this.logger.debug(
        `Event ${event.eventId} pushed to Kinesis. Shard: ${response.ShardId}, Sequence: ${response.SequenceNumber}`,
      );
    } catch (error) {
      this.logger.error(`Failed to push event ${event.eventId} to Kinesis:`, error);
      // Don't throw - we've already saved to PostgreSQL, Kinesis is supplementary
    }
    */
  }

  /**
   * Push multiple events to Kinesis in a batch (more efficient)
   */
  async pushEventsBatch(events: UserEvent[]): Promise<void> {
    if (!this.isEnabled || !this.kinesisClient || events.length === 0) {
      return;
    }

    /* Commented out until AWS SDK is installed
    try {
      // Kinesis batch limit is 500 records per request
      const batchSize = 500;
      const batches = this.chunkArray(events, batchSize);

      for (const batch of batches) {
        const records = batch.map((event) => ({
          Data: Buffer.from(JSON.stringify(this.serializeEvent(event))),
          PartitionKey: event.userId,
        }));

        const command = new PutRecordsCommand({
          StreamName: this.streamName,
          Records: records,
        });

        const response = await this.kinesisClient.send(command);

        const successCount = records.length - (response.FailedRecordCount || 0);
        this.logger.log(
          `Batch pushed ${successCount}/${records.length} events to Kinesis`,
        );

        // Log failed records for debugging
        if (response.FailedRecordCount && response.FailedRecordCount > 0) {
          this.logger.warn(
            `${response.FailedRecordCount} records failed to push to Kinesis`,
          );
          response.Records?.forEach((record, index) => {
            if (record.ErrorCode) {
              this.logger.error(
                `Record ${index} failed: ${record.ErrorCode} - ${record.ErrorMessage}`,
              );
            }
          });
        }
      }
    } catch (error) {
      this.logger.error('Failed to push event batch to Kinesis:', error);
    }
    */
  }

  /**
   * Serialize event for Kinesis stream
   * Includes metadata needed for downstream processing
   */
  private serializeEvent(event: UserEvent): any {
    // Extract metadata from payload
    const payload = event.payload || {};

    return {
      // Event identification
      eventId: event.eventId,
      userId: event.userId,
      eventType: event.eventType,
      timestamp: event.createdAt.toISOString(),

      // Event data (from payload)
      metadata: payload.metadata || null,
      sessionId: payload.sessionId || null,
      deviceType: payload.deviceType || null,
      appVersion: payload.appVersion || null,
      storeId: payload.storeId || null,

      // Location (from payload)
      location: payload.location || null,

      // Processing metadata
      streamedAt: new Date().toISOString(),
      source: 'only-coffee-backend',
    };
  }

  /**
   * Parse PostGIS POINT to lat/lon object
   */
  private parseLocation(location: string | null): { latitude: number; longitude: number } | null {
    if (!location) return null;

    try {
      // PostGIS format: "SRID=4326;POINT(longitude latitude)"
      const match = location.match(/POINT\(([^ ]+) ([^ ]+)\)/);
      if (match) {
        return {
          longitude: parseFloat(match[1]),
          latitude: parseFloat(match[2]),
        };
      }
    } catch (error) {
      this.logger.warn('Failed to parse location:', error);
    }

    return null;
  }

  /**
   * Utility: Chunk array into smaller batches
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Health check for Kinesis connection
   */
  async healthCheck(): Promise<{
    enabled: boolean;
    streamName: string;
    healthy: boolean;
    error?: string;
  }> {
    if (!this.isEnabled) {
      return {
        enabled: false,
        streamName: this.streamName,
        healthy: false,
      };
    }

    try {
      // TODO: Re-enable when @aws-sdk/client-kinesis is installed
      // const { DescribeStreamCommand } = await import('@aws-sdk/client-kinesis');
      // const command = new DescribeStreamCommand({
      //   StreamName: this.streamName,
      // });
      // await this.kinesisClient!.send(command);

      return {
        enabled: true,
        streamName: this.streamName,
        healthy: true, // Assume healthy when SDK not available
      };
    } catch (error: any) {
      return {
        enabled: true,
        streamName: this.streamName,
        healthy: false,
        error: error.message,
      };
    }
  }

  /**
   * Get Kinesis statistics for monitoring
   */
  getStats(): {
    enabled: boolean;
    streamName: string;
  } {
    return {
      enabled: this.isEnabled,
      streamName: this.streamName,
    };
  }
}
