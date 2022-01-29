// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

import { Grid, Paper, Switch } from '@mui/material';
import { grey } from '@mui/material/colors';
import React, { useEffect,useState } from 'react';

import { Chain } from '../../../../../../../extension-chains/src/types';
import useTranslation from '../../../../../../../extension-ui/src/hooks/useTranslation';
import { MAX_VOTES } from '../../../../../util/constants';
import { PersonsInfo } from '../../../../../util/plusTypes';
import { amountToHuman } from '../../../../../util/plusUtils';
import Identity from '../Identity';

interface Props {
  personsInfo: PersonsInfo;
  membersType?: string;
  chain: Chain;
  coin: string;
  decimals: number;
  setSelectedCandidates: React.Dispatch<React.SetStateAction<string[]>>;
}

export default function VoteMembers({ chain, coin, decimals, membersType, personsInfo, setSelectedCandidates }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const personsArray = personsInfo.infos.map((info, index) => { return { backed: personsInfo.backed[index], info: info, selected: false } });

  const [candidates, setCandidates] = useState(personsArray);

  const handleSelect = (event: React.ChangeEvent<HTMLInputElement>, index: number) => {
    // check if reached to MAX_VOTES
    if (event.target.checked && (candidates.filter((c) => c.selected)).length === MAX_VOTES) {
      event.target.checked = false;

      return;
    }
    const lastSelectedIndex = candidates.indexOf(candidates.find((p) => false === p.selected));
    const temp = candidates[index];
    temp.selected = event.target.checked;
    candidates.splice(index, 1);
    candidates.splice(lastSelectedIndex, 0, temp);
    setCandidates([...candidates]);
  };

  useEffect(() => {
    setSelectedCandidates(candidates.filter((c) => c.selected).map((c) => c.info.accountId.toString()));
  }, [candidates]);

  return (
    <>
      <Grid xs={12} sx={{ fontSize: 14, fontWeigth: 'bold', color: grey[600], fontFamily: 'fantasy', textAlign: 'center', p: '10px 1px 10px' }}>
        {membersType}
      </Grid>

      {candidates.map((p, index) => (
        <Paper elevation={2} key={index} sx={{ borderRadius: '10px', margin: '10px 10px 1px', p: '5px 10px 5px' }}>
          <Grid container>

            <Grid container item xs={7}>
              <Identity accountInfo={p.info} chain={chain} />
            </Grid>

            {p?.backed &&
              <Grid item xs={4} sx={{ fontSize: 11, textAlign: 'left' }}>
                {t('Backed')}{': '} {amountToHuman(p.backed, decimals, 2)} {coin}
              </Grid>
            }

            <Grid alignItems='center' item xs={1}>
              <Switch checked={p.selected} onChange={(e) => handleSelect(e, index)} size='small' />
            </Grid>

          </Grid>
        </Paper>))
      }
    </>
  );
}
