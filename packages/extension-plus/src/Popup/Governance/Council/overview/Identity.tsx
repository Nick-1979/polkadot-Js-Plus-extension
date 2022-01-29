// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import { Email as EmailIcon, LaunchRounded as LaunchRoundedIcon, Twitter as TwitterIcon } from '@mui/icons-material';
import { Grid, Link, Paper } from '@mui/material';
import { grey } from '@mui/material/colors';
import React from 'react';

import Identicon from '@polkadot/react-identicon';

import { Chain } from '../../../../../../extension-chains/src/types';
import useTranslation from '../../../../../../extension-ui/src/hooks/useTranslation';
import { ShortAddress } from '../../../../components';
import type { DeriveAccountInfo } from '@polkadot/api-derive/types';

interface Props {
  accountInfo: DeriveAccountInfo;
  chain: Chain;
  showAddress?: boolean;
  title: string;
}

export default function Identity({ accountInfo, chain, showAddress = false, title = '' }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();

  return (
    <Grid container>
      {title &&
        <Grid item sx={{ paddingBottom: '5px' }}>
          {title}
        </Grid>
      }

      <Grid container item xs={12} justifyContent='flex-end'>
        <Grid item xs={1}>
          <Identicon
            prefix={chain?.ss58Format ?? 42}
            size={24}
            theme={chain?.icon || 'polkadot'}
            value={String(accountInfo.accountId)}
          />
        </Grid>

        <Grid container item xs={11} justifyContent='flex-start' spacing={1} sx={{ paddingLeft: '5px' }}>
          {accountInfo.identity.displayParent &&
            <Grid item>
              {accountInfo.identity.displayParent} /
            </Grid>
          }
          <Grid item sx={accountInfo.identity.displayParent && { color: grey[500] }}>
            {accountInfo.identity.display} { }
          </Grid>

          {!(accountInfo.identity.displayParent || accountInfo.identity.display) &&
            <Grid item>
              <ShortAddress address={String(accountInfo.accountId)} />
            </Grid>
          }

          {accountInfo.identity.twitter &&
            <Grid item>
              <Link href={`https://TwitterIcon.com/${accountInfo.identity.twitter}`}>
                <TwitterIcon
                  color='primary'
                  sx={{ fontSize: 15 }}
                />
              </Link>
            </Grid>
          }

          {accountInfo.identity.email &&
            <Grid item>
              <Link href={`mailto:${accountInfo.identity.email}`}>
                <EmailIcon
                  color='secondary'
                  sx={{ fontSize: 15 }}
                />
              </Link>
            </Grid>
          }

          {accountInfo.identity.web &&
            <Grid item>
              <Link
                href={accountInfo.identity.web}
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

        {showAddress &&
          <Grid item xs={11} sx={{ paddingLeft: '5px', color: grey[500] }}>
            {String(accountInfo.accountId)}
          </Grid>
        }
      </Grid>
    </Grid>

  )
}