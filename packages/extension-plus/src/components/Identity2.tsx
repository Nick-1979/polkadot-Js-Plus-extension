// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable react/jsx-max-props-per-line */

import type { ApiPromise } from '@polkadot/api';
import type { DeriveAccountInfo } from '@polkadot/api-derive/types';

import { CheckCircleRounded as CheckCircleRoundedIcon, Email as EmailIcon, LaunchRounded as LaunchRoundedIcon, RemoveCircleRounded as RemoveCircleRoundedIcon, Twitter as TwitterIcon } from '@mui/icons-material';
import { Grid, Link, Skeleton, Tooltip } from '@mui/material';
import { grey } from '@mui/material/colors';
import React, { useContext, useEffect, useMemo, useState } from 'react';

import Identicon from '@polkadot/react-identicon';
import { decodeAddress, encodeAddress } from '@polkadot/util-crypto';

import { Chain } from '../../../extension-chains/src/types';
import { AccountContext } from '../../../extension-ui/src/components/contexts';
import { ShortAddress } from '.';

interface Props {
  api: ApiPromise | undefined;
  address: string;
  chain: Chain | undefined;
  iconSize?: number;
  showAddress?: boolean;
  title?: string;
  showSocial?: boolean;
}

function Identity2({ address, api, chain, iconSize = 24, showAddress = false, showSocial = true, title = '' }: Props): React.ReactElement<Props> {
  const { accounts } = useContext(AccountContext);
  const [info, setInfo] = useState<DeriveAccountInfo | undefined>();

  const [judgement, setJudgement] = useState<string | undefined | null>();
  const hasSocial = !!(info?.identity?.twitter || info?.identity?.web || info?.identity?.email);

  const localName = useMemo((): string | undefined => {
    return chain?.ss58Format ? accounts.find((acc) => address === encodeAddress(decodeAddress(acc.address), chain?.ss58Format))?.name : undefined;
  }, [accounts, address, chain?.ss58Format]);

  useEffect(() => {
    api && address && api.derive.accounts.info(address).then((i) => {
      if (!i?.identity?.display && localName) {
        i.identity.display = localName;
      }

      setInfo(i);
    });
  }, [address, api, localName]);

  useEffect(() => {
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
            <Grid alignItems='center' container item xs={1}>
              {info?.accountId &&
                <Identicon
                  prefix={chain?.ss58Format ?? 42}
                  size={iconSize}
                  theme={chain?.icon || 'polkadot'}
                  value={String(info?.accountId)}
                />}
            </Grid>
            <Grid alignItems='center' container item sx={{ paddingLeft: '5px' }} xs>
              <Grid alignItems='center' container id='namesAndSocials' item justifyContent='flex-start' xs={12}>
                <Grid alignItems='center' container id='names' item sx={{ flexWrap: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} xs={hasSocial && showSocial ? 9 : 12}>
                  <Grid alignItems='center' container item xs={1.5}>
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
              <Grid alignItems='center' container item justifyContent='flex-start' sx={{ paddingLeft: '18px' }} xs={12}>
                {showAddress &&
                  <Grid item sx={{ color: grey[500], textAlign: 'left' }} xs={12}>
                    {String(info?.accountId)}
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

export default React.memo(Identity2);