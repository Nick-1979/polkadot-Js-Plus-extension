// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

import { AccountBalance as AccountBalanceIcon, InfoOutlined as InfoOutlinedIcon, SummarizeOutlined as SummarizeOutlinedIcon, VolunteerActivismSharp as VolunteerActivismSharpIcon } from '@mui/icons-material';
import { Divider, Grid, Tab, Tabs } from '@mui/material';
import { grey } from '@mui/material/colors';
import React, { Dispatch, SetStateAction, useCallback, useEffect, useState } from 'react';

import { DeriveTreasuryProposals } from '@polkadot/api-derive/types';
import { BN, BN_MILLION, BN_ZERO, u8aConcat } from '@polkadot/util';

import useMetadata from '../../../../../extension-ui/src/hooks/useMetadata';
import useTranslation from '../../../../../extension-ui/src/hooks/useTranslation';
import { CircularProgressWithValue, PlusHeader, Popup, Progress, ShowBalance2, ShowValue } from '../../../components';
import getTips from '../../../util/api/getTips';
import { POLKADOT_COLOR } from '../../../util/constants';
import { ChainInfo, Tip } from '../../../util/plusTypes';
import { remainingTime } from '../../../util/plusUtils';
import ProposalOverview from './proposals/Overview';
import TipOverview from './tips/Overview';

interface Props {
  address: string;
  showTreasuryModal: boolean;
  chainInfo: ChainInfo | undefined;
  setTreasuryModalOpen: Dispatch<SetStateAction<boolean>>;
}
const EMPTY_U8A_32 = new Uint8Array(32);

export default function Treasury({ address, chainInfo, setTreasuryModalOpen, showTreasuryModal }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [tabValue, setTabValue] = useState('info');
  const [proposals, setProposals] = useState<DeriveTreasuryProposals | undefined>();
  const [activeProposalCount, setActiveProposalCount] = useState<number | undefined>();
  const [availableTreasuryBalance, setAvailableTreasuryBalance] = useState<BN | undefined>();
  const [spendPeriod, setSpendPeriod] = useState<BN | undefined>();
  const [remainingSpendPeriod, setRemainingSpendPeriod] = useState<string | undefined>();
  const [remainingSpendPeriodPrecent, setRemainingSpendPeriodPrecent] = useState<number | undefined>();
  const [pendingBounties, setPendingBounties] = useState<BN | undefined>();
  const [pendingProposals, setPendingProposals] = useState<BN | undefined>();
  const [spendable, setSpendable] = useState<BN | undefined>();
  const [spenablePercent, setSpendablePercent] = useState<number | undefined>();
  const [nextBurn, setNextBurn] = useState<BN | undefined>();
  const [approved, setApproved] = useState<BN | undefined>();

  const [tips, setTips] = useState<Tip[] | undefined | null>();
  const chain = useMetadata(chainInfo?.genesisHash, true);// TODO:double check to have genesisHash here
  const api = chainInfo?.api;
  const chainName = chainInfo?.chainName;

  useEffect(() => {
    if (!chainInfo) return;
    setProposals(undefined); // to clear when change changed

    // get all treasury proposals including approved
    chainInfo?.api.derive.treasury.proposals().then((p) => {
      setProposals(p);
      if (p) setActiveProposalCount(p.proposals.length + p.approvals.length);
      console.log('proposals:', JSON.parse(JSON.stringify(p.proposals)));
    }).catch(console.error);
  }, [chainInfo]);

  useEffect(() => {
    if (!chainInfo?.chainName) return;
    // get all treasury tips and just show proposedTips
    // eslint-disable-next-line no-void
    void getTips(chainInfo.chainName, 0, 30).then((res) => {
      console.log('tips:', res);
      const tipList = res?.data?.list;
      const proposedTips = tipList?.filter((tip) => tip.status === 'proposed');

      setTips(proposedTips);
    }).catch((e) => {
      console.error(e);
      setTips(null);
    });
  }, [chainInfo]);

  useEffect(() => {
    if (!pendingBounties || !pendingProposals || !availableTreasuryBalance) return;
    const spendable = availableTreasuryBalance.sub(pendingBounties).sub(pendingProposals);

    setSpendable(spendable);
    setSpendablePercent(spendable.muln(100).div(availableTreasuryBalance).toNumber());
    setApproved(pendingBounties.add(pendingProposals))
  }, [availableTreasuryBalance, pendingBounties, pendingProposals]);

  useEffect(() => {
    if (!chainInfo) return;
    const api = chainInfo.api;
    const treasuryAccount = u8aConcat(
      'modl',
      api.consts.treasury && api.consts.treasury.palletId
        ? api.consts.treasury.palletId.toU8a(true)
        : 'py/trsry',
      EMPTY_U8A_32
    ).subarray(0, 32);

    // eslint-disable-next-line no-void
    void api.derive.chain.bestNumber().then((bestNumber) => {
      const spendPeriod = new BN(api.consts.treasury?.spendPeriod) ?? BN_ZERO;

      setSpendPeriod(spendPeriod.divn(24 * 60 * 10));
      const remainingSpendPeriod = spendPeriod.sub(bestNumber.mod(spendPeriod));

      setRemainingSpendPeriod(remainingTime(remainingSpendPeriod.toNumber()));
      setRemainingSpendPeriodPrecent(spendPeriod.sub(remainingSpendPeriod).muln(100).div(spendPeriod).toNumber());
    }).catch(console.error);

    // eslint-disable-next-line no-void
    void api.derive.balances?.account(treasuryAccount).then((b) => {
      const treasuryBalance = b.freeBalance;

      setAvailableTreasuryBalance(treasuryBalance);

      const burn = api.consts.treasury.burn.mul(treasuryBalance).div(BN_MILLION);
      setNextBurn(burn);
    }).catch(console.error);

    // eslint-disable-next-line no-void
    void api.derive.bounties?.bounties()?.then((bounties) => {
      const pendingBounties = bounties.reduce((total, { bounty: { status, value } }) =>
        total.iadd(status.isApproved ? value : BN_ZERO), new BN(0)
      );

      setPendingBounties(pendingBounties);
    }).catch(console.error);

    // eslint-disable-next-line no-void
    void api.derive.treasury?.proposals()?.then((treasuryProposals) => {
      const pendingProposals = treasuryProposals.approvals.reduce((total, { proposal: { value } }) =>
        total.iadd(value), new BN(0)
      );

      setPendingProposals(pendingProposals);
    }).catch(console.error);
  }, [chainInfo]);

  const handleTabChange = useCallback((event: React.SyntheticEvent, newValue: string) => {
    setTabValue(newValue);
  }, []);

  const handleTreasuryModalClose = useCallback((): void => {
    setTreasuryModalOpen(false);
  }, [setTreasuryModalOpen]);

  return (
    <Popup handleClose={handleTreasuryModalClose} showModal={showTreasuryModal}>
      <PlusHeader action={handleTreasuryModalClose} chain={chainInfo?.chainName} closeText={'Close'} icon={<AccountBalanceIcon fontSize='small' />} title={'Treasury'} />
      <Grid container>
        <Grid item sx={{ borderBottom: 1, borderColor: 'divider', margin: '0px 30px' }} xs={12}>
          <Tabs indicatorColor='secondary' onChange={handleTabChange} textColor='secondary' value={tabValue} variant='fullWidth'>
            <Tab
              icon={<SummarizeOutlinedIcon fontSize='small' />}
              iconPosition='start'
              label={`Proposals (${activeProposalCount ?? 0}/${proposals?.proposalCount ?? 0})`}
              sx={{ fontSize: 11 }}
              value='proposals'
            />
            <Tab
              icon={<VolunteerActivismSharpIcon fontSize='small' />}
              iconPosition='start'
              label={`Tips (${tips?.length ?? 0})`}
              sx={{ fontSize: 11 }}
              value='tips'
            />
            <Tab
              icon={<InfoOutlinedIcon fontSize='small' />}
              iconPosition='start'
              label={t('info')}
              sx={{ fontSize: 11 }}
              value='info'
            />
          </Tabs>
        </Grid>
        {tabValue === 'proposals' &&
          <Grid item sx={{ height: 450, overflowY: 'auto' }} xs={12}>
            {chainInfo && proposals !== undefined
              ? <ProposalOverview address={address} chain={chain} chainInfo={chainInfo} proposalsInfo={proposals} />
              : <Progress title={t('Loading proposals ...')} />}
          </Grid>
        }
        {tabValue === 'tips' &&
          <Grid item sx={{ height: 450, overflowY: 'auto' }} xs={12}>
            {chainInfo && tips !== undefined
              ? <TipOverview address={address} chain={chain} chainInfo={chainInfo} tips={tips} />
              : <Progress title={t('Loading tips ...')} />}
          </Grid>
        }
        {tabValue === 'info' &&
          <Grid container item sx={{ fontSize: 12, pt: 8 }} xs={12}>
            <Grid item sx={{ textAlign: 'center' }} xs={6}>
              <Grid item sx={{ textAlign: 'center' }} xs={12}>
                <CircularProgressWithValue value={spenablePercent ?? 0} Kolor={chainName === 'Polkadot' ? POLKADOT_COLOR : 'black'} />
              </Grid>
              <Grid container item justifyContent='center' sx={{ pt: 2 }} xs={12}>
                <Grid item sx={{ color: grey[600] }}>
                  {t('spendable / available')}
                </Grid>
                <Grid container item justifyContent='center' spacing={0.5} sx={{ pt: 1 }} xs={12}>
                  <Grid item>
                    <ShowBalance2 api={api} balance={spendable} />
                  </Grid>
                  <Grid item>
                    /
                  </Grid>
                  <Grid item>
                    <ShowBalance2 api={api} balance={availableTreasuryBalance} />
                  </Grid>
                </Grid>
                <Grid item xs={12} sx={{ pt: 4 }}>
                  <Divider light />
                </Grid>
                <Grid container item justifyContent='center' spacing={1} sx={{ pt: 1 }} xs={12}>
                  <Grid item sx={{ color: grey[600] }}>
                    {t('approved')}
                  </Grid>
                  <Grid item>
                    <ShowBalance2 api={api} balance={approved} />
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
            <Grid container item justifyContent='center' sx={{ textAlign: 'center' }} xs={6}>
              <Grid item sx={{ textAlign: 'center' }} xs={12}>
                <CircularProgressWithValue value={remainingSpendPeriodPrecent ?? 0} Kolor={chainName === 'Polkadot' ? POLKADOT_COLOR : 'black'} />
              </Grid>
              <Grid container item justifyContent='center' spacing={0.5} sx={{ pt: 2 }} xs={12}>
                <Grid item sx={{ color: grey[600] }}>
                  {t('spend period')}
                </Grid>
                <Grid item>
                  <ShowValue value={spendPeriod?.toString()} />
                </Grid>
                <Grid item>
                  {t('days')}
                </Grid>
              </Grid>
              <Grid container item justifyContent='center' spacing={0.5} sx={{ pt: 1, textAlign: 'center' }} xs={12}>
                <Grid item sx={{ color: grey[600] }}>
                  {t('remaining')}
                </Grid>
                <Grid item>
                  <ShowValue value={remainingSpendPeriod} />
                </Grid>
              </Grid>
              <Grid item xs={12} sx={{ pt: 4 }}>
                <Divider light />
              </Grid>
              <Grid container item justifyContent='center' spacing={1} sx={{ pt: 1 }} xs={12}>
                <Grid item sx={{ color: grey[600] }}>
                  {t('next burn')}
                </Grid>
                <Grid item>
                  <ShowBalance2 api={api} balance={nextBurn} />
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        }
      </Grid>
    </Popup>
  );
}
