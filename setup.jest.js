/* eslint-disable no-undef */

// Use mock redis instead of actual in jest
jest.mock('ioredis', () => jest.requireActual('ioredis-mock'));