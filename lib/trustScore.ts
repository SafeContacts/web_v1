// lib/trustScore.ts
// Calculate trust score based on call logs, messages, duration, and frequency
import CallLog from '../models/CallLog';
import Person from '../models/Person';
import mongoose from 'mongoose';

export async function calculateTrustScoreFromInteractions(
  fromPersonId: mongoose.Types.ObjectId,
  toPersonId: mongoose.Types.ObjectId,
  userId: string
): Promise<number> {
  try {
    // Get all call logs between these persons (last 90 days)
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const callLogs = await CallLog.find({
      userId,
      fromPersonId,
      toPersonId,
      timestamp: { $gte: ninetyDaysAgo },
    }).lean();

    // Calculate metrics
    const callCount = callLogs.length;
    const totalDuration = callLogs.reduce((acc, log) => acc + (log.duration || 0), 0);
    const avgDuration = callCount > 0 ? totalDuration / callCount : 0;
    
    // Get message logs (SMS)
    const messageLogs = await CallLog.find({
      userId,
      fromPersonId,
      toPersonId,
      type: 'sms',
      timestamp: { $gte: ninetyDaysAgo },
    }).lean();
    const messageCount = messageLogs.length;

    // Calculate frequency (calls per week)
    const weeks = 90 / 7;
    const callsPerWeek = callCount / weeks;
    const messagesPerWeek = messageCount / weeks;

    // Scoring algorithm:
    // - Call frequency: up to 30 points (more calls = higher score)
    // - Call duration: up to 25 points (longer calls = higher trust)
    // - Message frequency: up to 20 points
    // - Recency: up to 15 points (recent interactions boost score)
    // - Consistency: up to 10 points (regular interactions)

    let score = 0;

    // Call frequency score (0-30 points)
    // 1 call/week = 10 points, 2 calls/week = 20 points, 3+ calls/week = 30 points
    score += Math.min(callsPerWeek * 10, 30);

    // Call duration score (0-25 points)
    // Average duration in minutes: 1 min = 5 points, 5 min = 15 points, 10+ min = 25 points
    const avgDurationMinutes = avgDuration / 60;
    score += Math.min(avgDurationMinutes * 2.5, 25);

    // Message frequency score (0-20 points)
    // 1 message/week = 7 points, 2 messages/week = 14 points, 3+ messages/week = 20 points
    score += Math.min(messagesPerWeek * 7, 20);

    // Recency score (0-15 points)
    // Most recent interaction within last 7 days = 15 points, 30 days = 10 points, 60 days = 5 points
    if (callLogs.length > 0 || messageLogs.length > 0) {
      const mostRecent = Math.max(
        ...callLogs.map(log => log.timestamp.getTime()),
        ...messageLogs.map(log => log.timestamp.getTime())
      );
      const daysSinceLastContact = (Date.now() - mostRecent) / (1000 * 60 * 60 * 24);
      if (daysSinceLastContact <= 7) score += 15;
      else if (daysSinceLastContact <= 30) score += 10;
      else if (daysSinceLastContact <= 60) score += 5;
    }

    // Consistency score (0-10 points)
    // If interactions are spread across multiple weeks, add consistency bonus
    if (callCount > 0) {
      const uniqueWeeks = new Set(
        callLogs.map(log => {
          const date = new Date(log.timestamp);
          return `${date.getFullYear()}-W${Math.ceil(date.getDate() / 7)}`;
        })
      ).size;
      score += Math.min(uniqueWeeks * 2, 10);
    }

    // Cap at 100
    return Math.min(100, Math.max(0, Math.round(score)));
  } catch (err) {
    console.error('Error calculating trust score from interactions', err);
    return 0;
  }
}

export async function updatePersonTrustScore(
  personId: mongoose.Types.ObjectId,
  fromPersonId: mongoose.Types.ObjectId,
  userId: string
): Promise<void> {
  try {
    const trustScore = await calculateTrustScoreFromInteractions(
      fromPersonId,
      personId,
      userId
    );
    
    // Update Person's trustScore if it exists as a field
    // Note: Person model might not have trustScore, so we might need to store it elsewhere
    // For now, we'll update it in the Contact model or ContactAlias
    await Person.findByIdAndUpdate(personId, {
      $set: { trustScore: trustScore },
    }, { upsert: false });
  } catch (err) {
    console.error('Error updating person trust score', err);
  }
}

