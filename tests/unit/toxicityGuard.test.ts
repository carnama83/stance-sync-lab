import { describe, it, expect } from '@jest/globals';
import { checkToxicity } from '@/lib/api/comments';

describe('Toxicity Guard', () => {
  it('should detect toxic keywords', () => {
    const toxicText = "You're an idiot and I hate you";
    const result = checkToxicity(toxicText);
    
    expect(result.score).toBeGreaterThan(0);
    expect(result.isToxic).toBe(true);
  });

  it('should detect excessive caps', () => {
    const capsText = "THIS IS REALLY ANNOYING BEHAVIOR";
    const result = checkToxicity(capsText);
    
    expect(result.score).toBeGreaterThan(0);
  });

  it('should detect excessive punctuation', () => {
    const punctuationText = "What??? Really??? Are you serious???";
    const result = checkToxicity(punctuationText);
    
    expect(result.score).toBeGreaterThan(0);
  });

  it('should allow normal text', () => {
    const normalText = "This is a reasonable comment about the topic.";
    const result = checkToxicity(normalText);
    
    expect(result.score).toBe(0);
    expect(result.isToxic).toBe(false);
  });

  it('should normalize score to 1.0 maximum', () => {
    const veryToxicText = "You idiot moron hate nazi terrorist kill die stupid dumb";
    const result = checkToxicity(veryToxicText);
    
    expect(result.score).toBeLessThanOrEqual(1.0);
  });

  it('should use conservative threshold for toxicity flag', () => {
    const borderlineText = "This is stupid";
    const result = checkToxicity(borderlineText);
    
    // Should have some score but not necessarily be flagged as toxic
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThan(1.0);
  });
});