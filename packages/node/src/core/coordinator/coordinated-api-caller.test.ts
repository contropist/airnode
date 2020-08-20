jest.mock('../config', () => ({
  config: {
    ois: [
      {
        title: 'oisTitle',
        endpoints: [
          {
            name: 'endpointName',
            reservedParameters: [
              { name: '_path', default: 'prices.1' },
              { name: '_type', default: 'int256' },
            ],
          },
        ],
      },
    ],
    nodeSettings: { cloudProvider: 'local:aws' },
  },
  security: { apiCredentials: {} },
}));

import { ethers } from 'ethers';
import * as adapter from '@airnode/adapter';
import * as fixtures from 'test/fixtures';
import * as coordinatedCaller from './coordinated-api-caller';
import * as state from './state';
import * as workers from '../workers/index';
import { ApiCallError, CoordinatorState, RequestErrorCode } from '../../types';

describe('callApis', () => {
  let initialState: CoordinatorState;

  beforeEach(() => {
    initialState = {
      aggregatedApiCalls: [],
      providers: [],
    };
  });

  it('filters out API calls that already have an error code', async () => {
    const spy = jest.spyOn(adapter, 'buildAndExecuteRequest');

    const error: ApiCallError = { errorCode: RequestErrorCode.InvalidOIS };
    const aggregatedApiCalls = [fixtures.createAggregatedApiCall({ error })];
    const newState = state.update(initialState, { aggregatedApiCalls });

    const res = await coordinatedCaller.callApis(newState);
    expect(res).toEqual([]);
    expect(spy).not.toHaveBeenCalled();
  });

  it('returns each API call with the response if successful', async () => {
    const spy = jest.spyOn(adapter, 'buildAndExecuteRequest') as any;
    spy.mockResolvedValueOnce({ data: { prices: ['443.76381', '441.83723'] } });

    const aggregatedApiCall = fixtures.createAggregatedApiCall();
    const aggregatedApiCalls = [aggregatedApiCall];
    const newState = state.update(initialState, { aggregatedApiCalls });

    const res = await coordinatedCaller.callApis(newState);

    expect(res[0]).toEqual({
      ...aggregatedApiCall,
      response: {
        value: '0x00000000000000000000000000000000000000000000000000000000000001b9',
      },
      error: undefined,
    });
    // Check that the correct value was selected
    expect(ethers.BigNumber.from(res[0].response!.value).toString()).toEqual('441');
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('returns an error if the API call fails', async () => {
    const spy = jest.spyOn(adapter, 'buildAndExecuteRequest') as any;
    spy.mockRejectedValueOnce(new Error('API call failed'));

    const aggregatedApiCall = fixtures.createAggregatedApiCall();
    const aggregatedApiCalls = [aggregatedApiCall];
    const newState = state.update(initialState, { aggregatedApiCalls });

    const res = await coordinatedCaller.callApis(newState);

    expect(res[0]).toEqual({
      ...aggregatedApiCall,
      response: undefined,
      error: {
        errorCode: RequestErrorCode.ApiCallFailed,
        message: 'Failed to call Endpoint:endpointName. Error: API call failed',
      },
    });
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('returns an error if the worker crashes', async () => {
    const spy = jest.spyOn(workers, 'spawn');
    spy.mockRejectedValueOnce(new Error('Worker crashed'));

    const aggregatedApiCall = fixtures.createAggregatedApiCall();
    const aggregatedApiCalls = [aggregatedApiCall];
    const newState = state.update(initialState, { aggregatedApiCalls });

    const res = await coordinatedCaller.callApis(newState);

    expect(res[0]).toEqual({
      ...aggregatedApiCall,
      response: undefined,
      error: { errorCode: RequestErrorCode.ApiCallFailed },
    });
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
