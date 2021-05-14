import { RegularRequest, FullRequest, Withdrawal } from '@api3/operation';

export function buildRegularRequest(overrides?: Partial<RegularRequest>): RegularRequest {
  return {
    requesterId: 'bob',
    type: 'regular',
    airnode: 'CurrencyConverterAirnode',
    template: 'template-1',
    client: 'MockAirnodeRrpClientFactory',
    fulfillFunctionName: 'fulfill',
    parameters: [{ type: 'bytes32', name: 'from', value: 'ETH' }],
    ...overrides,
  };
}

export function buildFullRequest(overrides?: Partial<FullRequest>): FullRequest {
  return {
    requesterId: 'bob',
    type: 'full',
    airnode: 'CurrencyConverterAirnode',
    endpoint: 'convertToUSD',
    oisTitle: 'Currency Converter API',
    client: 'MockAirnodeRrpClientFactory',
    fulfillFunctionName: 'fulfill',
    parameters: [
      { type: 'bytes32', name: 'from', value: 'ETH' },
      { type: 'bytes32', name: 'to', value: 'USD' },
      { type: 'bytes32', name: '_type', value: 'int256' },
      { type: 'bytes32', name: '_path', value: 'result' },
      { type: 'bytes32', name: '_times', value: '100000' },
    ],
    ...overrides,
  };
}

export function buildWithdrawal(overrides?: Partial<Withdrawal>): Withdrawal {
  return {
    requesterId: 'alice',
    type: 'withdrawal',
    airnode: 'CurrencyConverterAirnode',
    destination: 'alice',
    ...overrides,
  };
}
