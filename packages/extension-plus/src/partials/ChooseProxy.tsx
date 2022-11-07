// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable react/jsx-max-props-per-line */

/**
 * @description shows choose proxy when account isProxied 
 * */

import { faSitemap } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button as MuiButton, Grid } from '@mui/material';
import React from 'react';

import { ApiPromise } from '@polkadot/api';
import { Chain } from '@polkadot/extension-chains/types';

import useTranslation from '../../../extension-ui/src/hooks/useTranslation';
import { useProxies } from '../hooks';
import { Proxy, ProxyTypes } from '../util/plusTypes';
import SelectProxy from './SelectProxy';

interface Props {
  api: ApiPromise; 
  acceptableTypes: ProxyTypes[];
  chain: Chain;
  headerIcon: JSX.Element;
  onClick: React.MouseEventHandler<HTMLButtonElement> | undefined
  proxy: Proxy | undefined;
  realAddress: string;
  setSelectProxyModalOpen: React.Dispatch<React.SetStateAction<boolean>>
  selectProxyModalOpen: boolean;
  setProxy: React.Dispatch<React.SetStateAction<Proxy | undefined>>
}

export default function ChooseProxy({ acceptableTypes, api, chain, headerIcon, onClick, proxy, realAddress, selectProxyModalOpen, setProxy, setSelectProxyModalOpen }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const proxies = useProxies(api, realAddress);

  return (
    <>
      {!!proxies?.length &&
        <Grid item sx={{ mr: 1, mt: '8px' }} xs={3}>
          <MuiButton
            color='warning'
            fullWidth
            onClick={onClick}
            size='large'
            startIcon={<FontAwesomeIcon
              icon={faSitemap}
              rotation={proxy ? 90 : 270}
              size='xs'
              style={{ width: 20 }}
              title={t('Choose a proxy')}
            />}
            sx={{ height: '51.69px', px: 0, textTransform: 'none' }}
            variant='text'
          >
            {proxy ? t('Using proxy') : t('Choose proxy')}
          </MuiButton>
        </Grid>
      }
      {selectProxyModalOpen &&
        <SelectProxy
          acceptableTypes={acceptableTypes}
          api={api}
          chain={chain}
          icon={headerIcon}
          realAddress={realAddress}
          selectProxyModalOpen={selectProxyModalOpen}
          setProxy={setProxy}
          setSelectProxyModalOpen={setSelectProxyModalOpen}
        />
      }
    </>
  );
}
