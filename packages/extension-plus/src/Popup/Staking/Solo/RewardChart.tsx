// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable react/jsx-max-props-per-line */

/**
 * @description to show rewards chart
 * */

import { BarChart as BarChartIcon, ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { Accordion, AccordionDetails, AccordionSummary, Divider, Grid } from '@mui/material';
import { grey } from '@mui/material/colors';
import { BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, Title, Tooltip } from 'chart.js';
import React, { useCallback, useState } from 'react';
import { Bar } from 'react-chartjs-2';

import { ApiPromise } from '@polkadot/api';
import { Chain } from '@polkadot/extension-chains/types';

import useTranslation from '../../../../../extension-ui/src/hooks/useTranslation';
import { Identity, PlusHeader, Popup } from '../../../components';
import { RewardInfo } from '../../../util/plusTypes';
import { amountToHuman } from '../../../util/plusUtils';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const MAX_REWARDS_INFO_TO_SHOW = 20;

export const options = {
  responsive: true,
  plugins: {
    legend: {
      position: 'top' as const
    },
    title: {
      display: false,
      text: 'Latest received rewards'
    }
  }
};

interface Props {
  chain?: Chain | null;
  api: ApiPromise;
  setChartModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  showChartModal: boolean;
  rewardsInfo: RewardInfo[];
}

export default function RewardChart({ api, chain, rewardsInfo, setChartModalOpen, showChartModal }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const decimals = api && api.registry.chainDecimals[0];
  const token = api && api.registry.chainTokens[0];
  const [expanded, setExpanded] = useState<number>(-1);

  const handleAccordionChange = useCallback((panel: number) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : -1);
  }, []);

  const handleCloseModal = useCallback((): void => {
    setChartModalOpen(false);
  }, [setChartModalOpen]);

  if (!rewardsInfo?.length) {
    return (<></>);
  }

  const formateDate = (date: number) => {
    const options = { day: 'numeric', month: "short" };

    return new Date(date * 1000).toLocaleDateString('en-GB', options);
  };

  const sortedRewards = [...rewardsInfo];

  sortedRewards.sort((a, b) => a.era - b.era);

  // // remove duplicate eras
  // const dataset = [];

  // for (let i = 0; i < sortedRewards.length - 1; i++) {
  //   if (sortedRewards[i].era === sortedRewards[i + 1].era) {
  //     dataset.push(sortedRewards[i]?.timeStamp ? sortedRewards[i] : sortedRewards[i + 1]);
  //     i++;
  //     continue;
  //   }

  //   dataset.push(sortedRewards[i]);
  // }

  const DescSortedRewards = [...rewardsInfo];

  DescSortedRewards.sort((a, b) => b.era - a.era);

  // show the last MAX_REWARDS_INFO_TO_SHOW records
  // const labels = dataset.slice(dataset.length - MAX_REWARDS_INFO_TO_SHOW).map((d) => d.timeStamp ? formateDate(d.timeStamp) : d.era);
  const labels = sortedRewards.map((d) => formateDate(d.timeStamp));
  const y = sortedRewards.map((d) => amountToHuman(d.amount, decimals));

  const data = {
    datasets: [
      {
        backgroundColor: '#ed6c02',
        barPercentage: 0.35,
        data: y,
        label: token
      }
    ],
    labels
  };

  return (
    <Popup handleClose={handleCloseModal} showModal={showChartModal}>
      <PlusHeader action={handleCloseModal} chain={chain} closeText={'Close'} icon={<BarChartIcon fontSize='small' />} title={'Rewards'} />
      <Grid item sx={{ p: '15px 25px 20px' }} xs={12}>
        <Bar data={data} options={options} />
      </Grid>
      <Grid container item sx={{ fontSize: 11, height: '220px', overflowY: 'auto', scrollbarWidth: 'none' }} xs={12}>
        <Grid container item justifyContent='space-between' sx={{ fontSize: 11, fontWeight: '600', p: '5px 40px' }} xs={11}>
          <Grid item xs={4}>
            {t('Date')}
          </Grid>
          <Grid item sx={{ textAlign: 'center', pl: '15px' }} xs={4}>
            {t('Era')}
          </Grid>
          <Grid item sx={{ textAlign: 'right' }} xs={4}>
            {t('Reward')}
          </Grid>
        </Grid>
        <Grid item xs={12}>
          <Divider />
        </Grid>
        {DescSortedRewards.slice(0, MAX_REWARDS_INFO_TO_SHOW).map((d, index: number) =>
          <Accordion disableGutters expanded={expanded === index} key={index} onChange={handleAccordionChange(index)} sx={{ bgcolor: index % 2 && grey[200], flexGrow: 1, fontSize: 12 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ minHeight: '20px' }}>
              <Grid container item justifyContent='space-between' key={index} sx={{ px: '25px' }} xs={12}>
                <Grid item xs={4}>
                  {d.timeStamp ? new Date(d.timeStamp * 1000).toDateString() : d.era}
                </Grid>
                <Grid item sx={{ textAlign: 'center' }} xs={4}>
                  {d.era}
                </Grid>
                <Grid item sx={{ textAlign: 'right' }} xs={4}>
                  {amountToHuman(d.amount, decimals, 9)} {` ${token}`}
                </Grid>
              </Grid>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0 }}>
              <Grid item xs={12}>
                <Divider />
              </Grid>
              <Grid alignItems='center' container justifyContent='center' pl='45px' xs={12}>
                <Grid item sx={{ fontSize: 11, fontWeight: '600', textAlign: 'left' }} xs={2}>
                  {t('Received from')}:
                </Grid>
                <Grid item sx={{ textAlign: 'center' }} xs={10}>
                  {chain && <Identity address={d.validator} api={api} chain={chain} iconSize={20} showAddress={true} />}
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        )}
      </Grid>
    </Popup>
  );
}
