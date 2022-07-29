// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0

// TODO   ***description***

import '@polkadot/extension-mocks/chrome';

import type { DeriveProposal } from '@polkadot/api-derive/types';
import type { Codec } from '@polkadot/types/types';

import { render, waitFor } from '@testing-library/react';
import React from 'react';
import ReactDOM from 'react-dom';

import { AccountContext, SettingsContext } from '@polkadot/extension-ui/components';
import { buildHierarchy } from '@polkadot/extension-ui/util/buildHierarchy';
import { Balance } from '@polkadot/types/interfaces';

import Extension from '../../../../../extension-base/src/background/handlers/Extension';
import getCurrentBlockNumber from '../../../util/api/getCurrentBlockNumber';
import getProposals from '../../../util/api/getProposals';
import getReferendums from '../../../util/api/getReferendums';
import getChainInfo from '../../../util/getChainInfo';
import { ChainInfo, ProposalsInfo, Referendum } from '../../../util/plusTypes';
import { amountToHuman, formatMeta, remainingTime } from '../../../util/plusUtils';
import { accounts, chain, convictions, createAcc, createExtension, firstSuri, SettingsStruct } from '../../../util/test/testHelper';
import DemocracyProposals from './proposals/overview';
import ReferendumsOverview from './referendums/overview';
import Vote from './referendums/Vote';

jest.setTimeout(90000);
ReactDOM.createPortal = jest.fn((modal) => modal);

let chainInfo: ChainInfo;
let availableBalance: Balance;
let referendum: Referendum[] | null;
let proposal: DeriveProposal;
let proposalsInfo: ProposalsInfo | null;
let votingBalance: Balance;
let currentBlockNumber: number;
let rDescription: string[];
let pDescription: string[];
let rIndex: string;
let pIndex: string;
let end: string;
let delay: string;
let rValue;
let pValue;
let rMeta;
let pMeta;
let threshold: string;
let totalAye: string;
let totalNay: string;
const voteInfo = {
  refId: '54',
  voteType: 1
};
let extension: Extension;
let address: string;
let locked: string;
let deposit: string;
let seconds: string;

describe('Testing Democracy component', () => {
  beforeAll(async () => {
    currentBlockNumber = await getCurrentBlockNumber(chain('kusama').name);
    chainInfo = await getChainInfo(chain('kusama').name) as ChainInfo;

    extension = await createExtension();
    address = await createAcc(firstSuri, chainInfo.genesisHash, extension);

    await chainInfo.api.query.system.account(accounts[0].address).then((balance: Codec) => {
      availableBalance = chainInfo.api.createType('Balance', (balance.data.free).sub(balance.data.miscFrozen));
    });

    await chainInfo.api.derive.balances?.all(accounts[0].address).then((b) => {
      votingBalance = b?.votingBalance;
    });

    referendum = await getReferendums(chain('kusama').name);

    if (referendum?.length) {
      rValue = referendum[0].image?.proposal;
      rMeta = rValue?.registry.findMetaCall(rValue.callIndex);
      rDescription = formatMeta(rMeta?.meta);
      rIndex = String(referendum[0].index);
      end = referendum[0].status.end.toString();
      delay = referendum[0].status.delay.toString();
      threshold = referendum[0].status.threshold.toString();
      totalAye = Number(amountToHuman(referendum[0].status.tally.ayes.toString(), chainInfo.decimals)).toLocaleString();
      totalNay = Number(amountToHuman(Number(referendum[0].status.tally.nays).toString(), chainInfo.decimals)).toLocaleString();
    }

    const p = await getProposals('kusama');
    proposal = p.proposals;

    proposalsInfo = {
      proposals: proposal,
      accountsInfo: [{
        accountId: '16AtX7MJttsdF38k72qndwPLbpvdqDAsY5ttW14dZmpk1fLN',
        identity: {
          display: 'AMIRKHANEF',
          email: 'amiref007@gmail.com',
          judgements: [
            [
              1,
              {
                reasonable: null
              }
            ]
          ],
          legal: 'Amir ef',
          other: {
            'Phone Number': '+98'
          }
        }
      }],
      minimumDeposit: '0010000000'
    };

    if (proposal.length) {
      pValue = proposal[0].image?.proposal;
      pMeta = pValue?.registry.findMetaCall(pValue.callIndex);
      pIndex = String(proposal[0].index);
      locked = Number(amountToHuman(proposal[0].balance.toString(), chainInfo.decimals)).toLocaleString()
      deposit = amountToHuman(proposal[0].image.balance.toString(), chainInfo.decimals, 6);
      seconds = proposal[0].seconds.length - 1;
      pDescription = formatMeta(rMeta?.meta);
    }
  });

  test('Checking the Referendums\'s tab elements', () => {
    const { getByRole, queryByText } = render(
      <ReferendumsOverview
        address={accounts[0].address}
        chain={chain('kusama')}
        chainInfo={chainInfo}
        convictions={convictions}
        currentBlockNumber={currentBlockNumber}
        referendums={referendum[0] ? [referendum[0]] : []}
      />
    );

    if (referendum?.length) {
      expect(queryByText('No active referendum')).toBeFalsy();
      if (rValue) expect(queryByText(`${rMeta.section}. ${rMeta.method}`)).toBeTruthy();
      expect(queryByText(`#${rIndex}`)).toBeTruthy();
      expect(queryByText(`End: #${end}`)).toBeTruthy();
      expect(queryByText(`Delay: ${delay}`)).toBeTruthy();
      expect(queryByText(`Threshold: ${threshold}`)).toBeTruthy();
      // expect(queryByText(pDescription)).toBeTruthy();
      expect(queryByText('Proposer')).toBeTruthy();
      expect(queryByText(`Aye(${referendum[0].allAye?.length})`)).toBeTruthy();
      expect(queryByText(`Nay(${referendum[0].allNay?.length})`)).toBeTruthy();
      expect(queryByText(`${totalAye} ${chainInfo.coin}`)).toBeTruthy();
      expect(getByRole('progressbar')).toBeTruthy();
      expect(queryByText('Remaining Time', { exact: false })?.textContent).toEqual(`Remaining Time:  ${remainingTime(referendum[0].status.end - currentBlockNumber)}`);
      expect(queryByText(`${totalNay} ${chainInfo.coin}`)).toBeTruthy();
      expect(getByRole('button', { name: 'Aye' })).toBeTruthy();
      expect(getByRole('button', { name: 'Nay' })).toBeTruthy();
    } else {
      expect(queryByText('No active referendum')).toBeTruthy();
    }
  });

  test('Checking the Vote elements', async () => {
    const { container, queryByLabelText, queryByTestId, queryByText } = render(
      <SettingsContext.Provider value={SettingsStruct}>
        <AccountContext.Provider
          value={{
            accounts: accounts,
            hierarchy: buildHierarchy(accounts)
          }}
        >
          <Vote
            address={address}
            chain={chain('kusama')}
            chainInfo={chainInfo}
            convictions={convictions}
            showVoteReferendumModal={true}
            voteInfo={voteInfo}
          />
        </AccountContext.Provider>
      </SettingsContext.Provider>
    );

    expect(queryByText(`Vote to ${voteInfo.refId}`)).toBeTruthy();
    expect(queryByText('Voter:')).toBeTruthy();
    expect(queryByLabelText('Vote value')).toBeTruthy();

    await waitFor(() => {
      expect(queryByTestId('balance')?.textContent).toEqual(`Available: ${availableBalance.toHuman()}`);
    }, { timeout: 10000 });
    await waitFor(() => {
      expect(queryByTestId('showPlus')?.textContent).toEqual(`Voting balance: ${votingBalance.toHuman()}`);
    }, { timeout: 10000 });

    expect(queryByText('This value is locked for the duration of the vote')).toBeTruthy();
    expect(queryByText('Fee', { exact: false })).toBeTruthy();
    expect(queryByText('Locked for')).toBeTruthy();
    expect(container.querySelectorAll('option')).toHaveLength(convictions.length);
    expect(queryByText('The conviction to use for this vote with appropriate lock period')).toBeTruthy();
    expect(queryByLabelText('Password')).toBeTruthy();
    expect(queryByText('Please enter the account password')).toBeTruthy();
    expect(queryByTestId('confirmButton')).toBeTruthy();
  });

  test('Checking the Proposal\'s tab elements', () => {
    const { queryAllByRole, queryAllByText, queryByText } = render(
      <DemocracyProposals
        chain={chain('kusama')}
        chainInfo={chainInfo}
        proposalsInfo={proposalsInfo?.proposals.length ? proposalsInfo : []}
      />
    );

    if (proposalsInfo?.proposals.length) {
      expect(queryByText('No active proposal')).toBeFalsy();
      pValue && expect(queryAllByText(`${pMeta.section}. ${pMeta.method}`)).toBeTruthy();
      expect(queryByText(`#${pIndex}`)).toBeTruthy();
      expect(queryAllByText(`Locked: ${locked} ${chainInfo.coin}`)).toBeTruthy();
      expect(queryAllByText(`Deposit: ${deposit} ${chainInfo.coin}`)).toBeTruthy();
      expect(queryAllByText(`Seconds: ${seconds}`)).toBeTruthy();
      // expect(queryByText(pDescription)).toBeTruthy();
      expect(queryAllByText('Proposer')).toBeTruthy();
      expect(queryByText(proposalsInfo.accountsInfo[0].identity.display)).toBeTruthy();
      expect(queryByText(proposalsInfo.accountsInfo[0].accountId)).toBeTruthy();
      expect(queryAllByRole('button')).toBeTruthy();
    } else {
      expect(queryByText('No active proposal')).toBeTruthy();
    }
  });
});
