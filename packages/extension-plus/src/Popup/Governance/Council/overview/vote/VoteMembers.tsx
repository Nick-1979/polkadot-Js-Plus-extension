// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import { Email as EmailIcon, LaunchRounded as LaunchRoundedIcon, Twitter as TwitterIcon } from '@mui/icons-material';
import { Grid, Link, Paper, Switch } from '@mui/material';
import { grey } from '@mui/material/colors';
import React, { useState, useEffect } from 'react';

import Identicon from '@polkadot/react-identicon';

import { Chain } from '../../../../../../../extension-chains/src/types';
import useTranslation from '../../../../../../../extension-ui/src/hooks/useTranslation';
import { ShortAddress } from '../../../../../components';
import { PersonsInfo } from '../../../../../util/plusTypes';
import { amountToHuman } from '../../../../../util/plusUtils';

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
    console.log('(event.target.checked:', event.target.checked);
    console.log('index:', index);

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
            <Grid item xs={1}>
              <Identicon
                prefix={chain?.ss58Format ?? 42}
                size={24}
                theme={chain?.icon || 'polkadot'}
                value={String(p.info.accountId)}
              />
            </Grid>
            <Grid container item xs={11} justifyContent='space-between'>
              <Grid container item xs={6}>
                {p.info.identity.displayParent &&
                  <Grid item>
                    {p.info.identity.displayParent} /
                  </Grid>
                }
                <Grid item sx={p.info.identity.displayParent && { color: grey[500] }}>
                  {p.info.identity.display} { }
                </Grid>

                {!(p.info.identity.displayParent || p.info.identity.display) &&
                  <Grid item>
                    <ShortAddress address={String(p.info.accountId)} />
                  </Grid>
                }

                {p.info.identity.twitter &&
                  <Grid item>
                    <Link href={`https://TwitterIcon.com/${p.info.identity.twitter}`}>
                      <TwitterIcon
                        color='primary'
                        sx={{ fontSize: 15 }}
                      />
                    </Link>
                  </Grid>
                }

                {p.info.identity.email &&
                  <Grid item>
                    <Link href={`mailto:${p.info.identity.email}`}>
                      <EmailIcon
                        color='secondary'
                        sx={{ fontSize: 15 }}
                      />
                    </Link>
                  </Grid>
                }

                {p.info.identity.web &&
                  <Grid item>
                    <Link
                      href={p.info.identity.web}
                      rel='noreferrer'
                      target='_blank'
                    >
                      <LaunchRoundedIcon
                        color='primary'
                        sx={{ fontSize: 15 }}
                      />
                    </Link>
                  </Grid>
                }
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

          </Grid>

        </Paper>))
      }

    </>
  );
}
