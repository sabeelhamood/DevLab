const waitFor = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

let createLearningAnalyticsExporter

beforeAll(async () => {
  ;({ default: createLearningAnalyticsExporter } = await import('../learningAnalyticsExporter.js'))
})

describe('learningAnalyticsExporter', () => {
  it('retries failed exports and eventually succeeds', async () => {
    const logger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    }

    let attempt = 0
    const transport = jest.fn().mockImplementation(async () => {
      attempt += 1
      if (attempt < 2) {
        throw new Error('Simulated failure')
      }
    })

    const exporter = createLearningAnalyticsExporter({
      logger,
      transport,
      scheduleFn: (fn) => fn(),
      config: {
        maxAttempts: 3,
        baseDelayMs: 1,
        maxDelayMs: 10
      }
    })

    await exporter.exportCompetition({ competitionId: 'comp-123' })

    expect(transport).toHaveBeenCalledTimes(2)
    expect(exporter.getPendingJobs()).toBe(0)
    expect(logger.warn).toHaveBeenCalled()
    expect(logger.info).toHaveBeenCalledWith('learningAnalyticsExporter.success', {
      competitionId: 'comp-123',
      attempts: 1
    })
  })

  it('stops retrying after max attempts', async () => {
    const logger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    }

    const transport = jest.fn().mockRejectedValue(new Error('Fail always'))

    const exporter = createLearningAnalyticsExporter({
      logger,
      transport,
      scheduleFn: (fn) => fn(),
      config: {
        maxAttempts: 2,
        baseDelayMs: 1,
        maxDelayMs: 10
      }
    })

    await exporter.exportCompetition({ competitionId: 'comp-456' })
    expect(transport).toHaveBeenCalledTimes(2)
    expect(logger.error).toHaveBeenCalledWith('learningAnalyticsExporter.giveUp', expect.any(Object))
    expect(exporter.getPendingJobs()).toBe(0)
  })
})

