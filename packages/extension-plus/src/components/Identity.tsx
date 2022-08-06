// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable react/jsx-max-props-per-line */

import type { ApiPromise } from '@polkadot/api';
import type { DeriveAccountInfo } from '@polkadot/api-derive/types';

import { CheckCircleRounded as CheckCircleRoundedIcon, Email as EmailIcon, LaunchRounded as LaunchRoundedIcon, RemoveCircleRounded as RemoveCircleRoundedIcon, Twitter as TwitterIcon } from '@mui/icons-material';
import { Grid, Link, Skeleton, Tooltip } from '@mui/material';
import { grey } from '@mui/material/colors';
import React, { useEffect, useState } from 'react';

import Identicon from '@polkadot/react-identicon';

import { Chain } from '../../../extension-chains/src/types';
import { ShortAddress } from '.';

interface Props {
  api?: ApiPromise;
  address?: string;
  name?: string;
  accountInfo?: DeriveAccountInfo;
  chain: Chain;
  iconSize?: number;
  showAddress?: boolean;
  title?: string;
  totalStaked?: string;
  showSocial?: boolean;
}

function Identity({ accountInfo, address, api, chain, iconSize = 24, name, showAddress = false, showSocial = true, title = '', totalStaked = '' }: Props): React.ReactElement<Props> {
  const [info, setInfo] = useState<DeriveAccountInfo | undefined>();
  const [hasSocial, setHasSocial] = useState<boolean | undefined>();
  const [judgement, setJudgement] = useState<string | undefined>();

  useEffect(() => {
    if (accountInfo) {
      return setInfo(accountInfo);
    }

    api && address && api.derive.accounts.info(address).then((i) => {
      if (!i?.identity && name) {
        i.identity.display = name;
      }

      setInfo(i);
    });
  }, [address, accountInfo, api, name]);

  useEffect(() => {
    setHasSocial(!!(info?.identity?.twitter || info?.identity?.web || info?.identity?.email));

    // to check if the account has a judgement to set a verified green check
    setJudgement(info?.identity?.judgements && JSON.stringify(info?.identity?.judgements).match(/reasonable|knownGood/gi));
  }, [info]);

  return (
    <>
      <Grid container>
        {title &&
          <Grid item sx={{ pb: '5px' }}>
            {title}
          </Grid>
        }
        {info
          ? <Grid alignItems='center' container item justifyContent='flex-start' xs={12}>
            <Grid item xs={1}>
              {info?.accountId &&
                <Identicon
                  prefix={chain?.ss58Format ?? 42}
                  size={iconSize}
                  theme={chain?.icon || 'polkadot'}
                  value={String(info?.accountId)}
                />}
            </Grid>
            <Grid alignItems='center' container item sx={{ paddingLeft: '5px' }} xs={11}>
              <Grid alignItems='center' container id='namesAndSocials' item justifyContent='flex-start' spacing={0.3} xs={12}>
                <Grid container id='names' item sx={{ flexWrap: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} xs={hasSocial && showSocial ? 9 : 12}>
                  <Grid item sx={{ pr: '5px' }}>
                    {judgement
                      ? <Tooltip id='judgement' title={judgement}><CheckCircleRoundedIcon color='success' sx={{ fontSize: 15 }} /></Tooltip>
                      : <RemoveCircleRoundedIcon color='disabled' sx={{ fontSize: 15 }} />
                    }
                  </Grid>
                  {info?.identity?.displayParent &&
                    <Grid item sx={{ textOverflow: 'ellipsis' }}>
                      {info?.identity.displayParent} /
                    </Grid>
                  }
                  {(info?.identity?.display || info?.nickname) &&
                    <Grid item sx={info?.identity?.displayParent && { color: grey[500], textOverflow: 'ellipsis' }}>
                      {info?.identity?.display ?? info?.nickname} { }
                    </Grid>
                  }
                  {!(info?.identity?.displayParent || info?.identity?.display || info?.nickname) &&
                    <Grid item sx={{ textAlign: 'letf' }}>
                      {info?.accountId && <ShortAddress address={String(info?.accountId)} fontSize={11} />}
                    </Grid>
                  }
                </Grid>
                {showSocial && <Grid container id='socials' item justifyContent='flex-start' xs={hasSocial ? 3 : 0}>
                  {info?.identity?.twitter &&
                    <Grid item>
                      <Link
                        href={`https://twitter.com/${info?.identity.twitter}`}
                        rel='noreferrer'
                        target='_blank'
                      >
                        <TwitterIcon
                          color='primary'
                          sx={{ fontSize: 15 }}
                        />
                      </Link>
                    </Grid>
                  }
                  {info?.identity?.email &&
                    <Grid item>
                      <Link href={`mailto:${info?.identity.email}`}>
                        <EmailIcon
                          color='secondary'
                          sx={{ fontSize: 15 }}
                        />
                      </Link>
                    </Grid>
                  }
                  {info?.identity?.web &&
                    <Grid item>
                      <Link
                        href={info?.identity.web}
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
                }
              </Grid>
              <Grid alignItems='center' container id='totalStaked' item justifyContent='flex-start' sx={{ paddingLeft: '18px' }} xs={12}>
                {showAddress &&
                  <Grid item sx={{ color: grey[500], textAlign: 'left' }} xs={12}>
                    {String(info?.accountId)}
                  </Grid>
                }
                {totalStaked &&
                  <Grid item sx={{ color: grey[500], fontSize: 11, lineHeight: '10px', textAlign: 'left' }} xs={12}>
                    {totalStaked}
                  </Grid>
                }
              </Grid>
            </Grid>
          </Grid>
          : <Skeleton sx={{ fontWeight: 'bold', lineHeight: '16px', width: '80%' }} />
        }
      </Grid>
    </>
  );
}

export default React.memo(Identity);
