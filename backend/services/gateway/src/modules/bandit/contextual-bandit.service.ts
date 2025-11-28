import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Promotion } from '@shared/database/entities';

/**
 * Bandit Arm represents a promotion/offer choice
 */
export interface BanditArm {
  armId: string; // Promotion ID
  name: string;
  successes: number; // Conversions (purchases, redemptions)
  failures: number; // Impressions without conversion
  totalPulls: number;
  conversionRate: number;
  lastUpdated: Date;

  // Context-specific statistics
  contextStats?: Map<string, ArmStats>;
}

export interface ArmStats {
  successes: number;
  failures: number;
  totalPulls: number;
  conversionRate: number;
}

/**
 * Context for bandit selection
 */
export interface BanditContext {
  userId?: string;
  segment?: string;
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
  dayOfWeek?: string;
  weather?: {
    temperature: number;
    condition: string;
  };
  location?: {
    latitude: number;
    longitude: number;
  };
  churnRisk?: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Bandit selection result
 */
export interface BanditSelection {
  armId: string;
  promotionId: string;
  name: string;
  reason: string;
  expectedReward: number; // 0-1 probability
  explorationScore: number; // How much this is exploration vs exploitation
  context: BanditContext;
  selectionId: string; // Track this selection for reward feedback
}

/**
 * Performance metrics
 */
export interface BanditMetrics {
  totalPulls: number;
  totalConversions: number;
  overallConversionRate: number;
  arms: Array<{
    armId: string;
    name: string;
    conversionRate: number;
    pulls: number;
    isWinning: boolean;
  }>;
  explorationRate: number; // % of pulls that were exploratory
}

@Injectable()
export class ContextualBanditService {
  private readonly logger = new Logger(ContextualBanditService.name);

  // In-memory cache of arm statistics (could move to Redis)
  private arms = new Map<string, BanditArm>();

  // Track selections for reward feedback
  private selections = new Map<string, { armId: string; context: BanditContext; timestamp: Date }>();

  // Hyperparameters
  private readonly EXPLORATION_BONUS = 0.1; // UCB exploration parameter
  private readonly MIN_PULLS_FOR_EXPLOITATION = 10; // Min pulls before trusting stats

  constructor(
    @InjectRepository(Promotion)
    private readonly promotionRepository: Repository<Promotion>,
  ) {
    // Initialize arms from active promotions
    this.initializeArms().catch((err) => {
      this.logger.error('Failed to initialize bandit arms:', err);
    });
  }

  /**
   * Select which promotion to show using Thompson Sampling
   * Thompson Sampling: Sample from Beta distribution for each arm, pick highest sample
   */
  async selectArm(context: BanditContext): Promise<BanditSelection> {
    // Get eligible arms (active promotions)
    const eligibleArms = Array.from(this.arms.values()).filter((arm) =>
      this.isArmEligible(arm, context)
    );

    if (eligibleArms.length === 0) {
      throw new Error('No eligible promotions available');
    }

    // Thompson Sampling: Sample from Beta(successes + 1, failures + 1) for each arm
    const samples = eligibleArms.map((arm) => {
      const contextKey = this.getContextKey(context);
      const stats = this.getContextualStats(arm, contextKey);

      // Beta distribution parameters (add 1 for Laplace smoothing)
      const alpha = stats.successes + 1;
      const beta = stats.failures + 1;

      // Sample from Beta distribution
      const sample = this.sampleBeta(alpha, beta);

      return { arm, sample, stats };
    });

    // Select arm with highest sample
    const selected = samples.reduce((best, current) =>
      current.sample > best.sample ? current : best
    );

    // Determine if this is exploration or exploitation
    const isExploration = selected.stats.totalPulls < this.MIN_PULLS_FOR_EXPLOITATION;
    const explorationScore = isExploration ? 0.8 : 0.2;

    // Generate unique selection ID
    const selectionId = this.generateSelectionId();

    // Store selection for reward feedback
    this.selections.set(selectionId, {
      armId: selected.arm.armId,
      context,
      timestamp: new Date(),
    });

    return {
      armId: selected.arm.armId,
      promotionId: selected.arm.armId,
      name: selected.arm.name,
      reason: isExploration
        ? 'Testing new offer (exploration)'
        : `Best performer (${(selected.stats.conversionRate * 100).toFixed(1)}% conversion)`,
      expectedReward: selected.sample,
      explorationScore,
      context,
      selectionId,
    };
  }

  /**
   * Alternative: Upper Confidence Bound (UCB) algorithm
   * UCB balances exploitation (best known) with exploration (uncertainty)
   */
  async selectArmUCB(context: BanditContext): Promise<BanditSelection> {
    const eligibleArms = Array.from(this.arms.values()).filter((arm) =>
      this.isArmEligible(arm, context)
    );

    if (eligibleArms.length === 0) {
      throw new Error('No eligible promotions available');
    }

    // Calculate total pulls across all arms
    const totalPulls = eligibleArms.reduce((sum, arm) => sum + arm.totalPulls, 0);

    // Calculate UCB score for each arm
    const scores = eligibleArms.map((arm) => {
      const contextKey = this.getContextKey(context);
      const stats = this.getContextualStats(arm, contextKey);

      if (stats.totalPulls === 0) {
        // Force exploration of unplayed arms
        return { arm, score: Infinity, stats };
      }

      // UCB formula: mean + sqrt(2 * ln(totalPulls) / armPulls)
      const exploitationScore = stats.conversionRate;
      const explorationBonus = Math.sqrt((2 * Math.log(totalPulls)) / stats.totalPulls);
      const ucbScore = exploitationScore + (this.EXPLORATION_BONUS * explorationBonus);

      return { arm, score: ucbScore, stats };
    });

    // Select arm with highest UCB score
    const selected = scores.reduce((best, current) =>
      current.score > best.score ? current : best
    );

    const isExploration = selected.stats.totalPulls < this.MIN_PULLS_FOR_EXPLOITATION;
    const explorationScore = isExploration ? 0.8 : 0.2;

    const selectionId = this.generateSelectionId();

    this.selections.set(selectionId, {
      armId: selected.arm.armId,
      context,
      timestamp: new Date(),
    });

    return {
      armId: selected.arm.armId,
      promotionId: selected.arm.armId,
      name: selected.arm.name,
      reason: isExploration
        ? 'Exploring new offer (UCB)'
        : `Best UCB score (${(selected.stats.conversionRate * 100).toFixed(1)}% conversion)`,
      expectedReward: selected.stats.conversionRate,
      explorationScore,
      context,
      selectionId,
    };
  }

  /**
   * Epsilon-Greedy: Simple exploration strategy
   * With probability epsilon, explore randomly; otherwise exploit best
   */
  async selectArmEpsilonGreedy(
    context: BanditContext,
    epsilon: number = 0.1,
  ): Promise<BanditSelection> {
    const eligibleArms = Array.from(this.arms.values()).filter((arm) =>
      this.isArmEligible(arm, context)
    );

    if (eligibleArms.length === 0) {
      throw new Error('No eligible promotions available');
    }

    let selectedArm: BanditArm;
    let isExploration = false;

    if (Math.random() < epsilon) {
      // Explore: Random selection
      selectedArm = eligibleArms[Math.floor(Math.random() * eligibleArms.length)];
      isExploration = true;
    } else {
      // Exploit: Select best performing arm
      selectedArm = eligibleArms.reduce((best, current) => {
        const bestStats = this.getContextualStats(best, this.getContextKey(context));
        const currentStats = this.getContextualStats(current, this.getContextKey(context));
        return currentStats.conversionRate > bestStats.conversionRate ? current : best;
      });
    }

    const contextKey = this.getContextKey(context);
    const stats = this.getContextualStats(selectedArm, contextKey);
    const selectionId = this.generateSelectionId();

    this.selections.set(selectionId, {
      armId: selectedArm.armId,
      context,
      timestamp: new Date(),
    });

    return {
      armId: selectedArm.armId,
      promotionId: selectedArm.armId,
      name: selectedArm.name,
      reason: isExploration
        ? `Random exploration (ε=${epsilon})`
        : `Best performer (${(stats.conversionRate * 100).toFixed(1)}% conversion)`,
      expectedReward: stats.conversionRate,
      explorationScore: isExploration ? 1.0 : 0.0,
      context,
      selectionId,
    };
  }

  /**
   * Record reward (conversion) for a selection
   */
  async recordReward(
    selectionId: string,
    reward: number, // 0 = no conversion, 1 = conversion
    rewardValue?: number, // Optional: actual monetary value
  ): Promise<void> {
    const selection = this.selections.get(selectionId);

    if (!selection) {
      this.logger.warn(`Selection ${selectionId} not found for reward feedback`);
      return;
    }

    const arm = this.arms.get(selection.armId);
    if (!arm) {
      this.logger.warn(`Arm ${selection.armId} not found`);
      return;
    }

    // Update global stats
    if (reward > 0) {
      arm.successes++;
    } else {
      arm.failures++;
    }
    arm.totalPulls++;
    arm.conversionRate = arm.successes / arm.totalPulls;
    arm.lastUpdated = new Date();

    // Update context-specific stats
    const contextKey = this.getContextKey(selection.context);
    if (!arm.contextStats) {
      arm.contextStats = new Map();
    }

    let contextStats = arm.contextStats.get(contextKey);
    if (!contextStats) {
      contextStats = {
        successes: 0,
        failures: 0,
        totalPulls: 0,
        conversionRate: 0,
      };
      arm.contextStats.set(contextKey, contextStats);
    }

    if (reward > 0) {
      contextStats.successes++;
    } else {
      contextStats.failures++;
    }
    contextStats.totalPulls++;
    contextStats.conversionRate = contextStats.successes / contextStats.totalPulls;

    this.logger.log(
      `Reward recorded for ${arm.name}: ${reward} (${arm.conversionRate.toFixed(3)} CVR)`,
    );

    // Clean up old selections (keep last 1000)
    if (this.selections.size > 1000) {
      const oldestKeys = Array.from(this.selections.keys()).slice(0, 100);
      oldestKeys.forEach((key) => this.selections.delete(key));
    }
  }

  /**
   * Get performance metrics
   */
  async getMetrics(): Promise<BanditMetrics> {
    const arms = Array.from(this.arms.values());

    const totalPulls = arms.reduce((sum, arm) => sum + arm.totalPulls, 0);
    const totalConversions = arms.reduce((sum, arm) => sum + arm.successes, 0);
    const overallConversionRate = totalPulls > 0 ? totalConversions / totalPulls : 0;

    // Find winning arm
    const bestArm = arms.reduce((best, current) =>
      current.conversionRate > best.conversionRate ? current : best
    );

    // Calculate exploration rate (arms with < MIN_PULLS)
    const exploratoryPulls = arms
      .filter((arm) => arm.totalPulls < this.MIN_PULLS_FOR_EXPLOITATION)
      .reduce((sum, arm) => sum + arm.totalPulls, 0);
    const explorationRate = totalPulls > 0 ? exploratoryPulls / totalPulls : 0;

    return {
      totalPulls,
      totalConversions,
      overallConversionRate,
      explorationRate,
      arms: arms.map((arm) => ({
        armId: arm.armId,
        name: arm.name,
        conversionRate: arm.conversionRate,
        pulls: arm.totalPulls,
        isWinning: arm.armId === bestArm.armId,
      })),
    };
  }

  /**
   * Reset arm statistics (for testing or new campaign periods)
   */
  async resetArm(armId: string): Promise<void> {
    const arm = this.arms.get(armId);
    if (arm) {
      arm.successes = 0;
      arm.failures = 0;
      arm.totalPulls = 0;
      arm.conversionRate = 0;
      arm.contextStats = new Map();
      arm.lastUpdated = new Date();
      this.logger.log(`Reset arm: ${arm.name}`);
    }
  }

  /**
   * Add new arm (promotion) to the bandit
   */
  async addArm(promotionId: string, name: string): Promise<BanditArm> {
    const arm: BanditArm = {
      armId: promotionId,
      name,
      successes: 0,
      failures: 0,
      totalPulls: 0,
      conversionRate: 0,
      lastUpdated: new Date(),
      contextStats: new Map(),
    };

    this.arms.set(promotionId, arm);
    this.logger.log(`Added new arm: ${name}`);

    return arm;
  }

  /**
   * Remove arm from bandit
   */
  async removeArm(armId: string): Promise<void> {
    this.arms.delete(armId);
    this.logger.log(`Removed arm: ${armId}`);
  }

  /**
   * Initialize arms from active promotions
   */
  private async initializeArms(): Promise<void> {
    const promotions = await this.promotionRepository.find({
      where: { isActive: true },
    });

    for (const promotion of promotions) {
      await this.addArm(promotion.promotionId, promotion.name);
    }

    this.logger.log(`Initialized ${this.arms.size} bandit arms`);
  }

  /**
   * Check if arm is eligible for given context
   */
  private isArmEligible(arm: BanditArm, context: BanditContext): boolean {
    // TODO: Add promotion targeting rules
    // For now, all arms are eligible
    return true;
  }

  /**
   * Get contextual statistics for an arm
   */
  private getContextualStats(arm: BanditArm, contextKey: string): ArmStats {
    if (!arm.contextStats || !arm.contextStats.has(contextKey)) {
      // Return global stats if no context-specific data
      return {
        successes: arm.successes,
        failures: arm.failures,
        totalPulls: arm.totalPulls,
        conversionRate: arm.conversionRate,
      };
    }

    return arm.contextStats.get(contextKey)!;
  }

  /**
   * Generate context key for bucketing
   */
  private getContextKey(context: BanditContext): string {
    const parts: string[] = [];

    if (context.segment) parts.push(`seg:${context.segment}`);
    if (context.timeOfDay) parts.push(`time:${context.timeOfDay}`);
    if (context.churnRisk) parts.push(`churn:${context.churnRisk}`);

    return parts.length > 0 ? parts.join('|') : 'global';
  }

  /**
   * Sample from Beta distribution (using Gamma distribution)
   */
  private sampleBeta(alpha: number, beta: number): number {
    const x = this.sampleGamma(alpha, 1);
    const y = this.sampleGamma(beta, 1);
    return x / (x + y);
  }

  /**
   * Sample from Gamma distribution (Marsaglia and Tsang method)
   */
  private sampleGamma(shape: number, scale: number): number {
    if (shape < 1) {
      return this.sampleGamma(shape + 1, scale) * Math.pow(Math.random(), 1 / shape);
    }

    const d = shape - 1 / 3;
    const c = 1 / Math.sqrt(9 * d);

    while (true) {
      let x: number;
      let v: number;

      do {
        x = this.sampleNormal(0, 1);
        v = 1 + c * x;
      } while (v <= 0);

      v = v * v * v;
      const u = Math.random();

      if (u < 1 - 0.0331 * x * x * x * x) {
        return d * v * scale;
      }

      if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) {
        return d * v * scale;
      }
    }
  }

  /**
   * Sample from Normal distribution (Box-Muller transform)
   */
  private sampleNormal(mean: number, stdDev: number): number {
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return z0 * stdDev + mean;
  }

  /**
   * Generate unique selection ID
   */
  private generateSelectionId(): string {
    return `sel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get all arms
   */
  async getAllArms(): Promise<BanditArm[]> {
    return Array.from(this.arms.values());
  }

  /**
   * Get arm by ID
   */
  async getArm(armId: string): Promise<BanditArm | undefined> {
    return this.arms.get(armId);
  }
}
