// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import { Container, Grid, Modal } from '@mui/material';
import QRCode from 'qrcode.react';
import React, { Dispatch, SetStateAction, useCallback } from 'react';
import ReactDom from 'react-dom';

import Identicon from '@polkadot/react-identicon';

import useTranslation from '../../../../extension-ui/src/hooks/useTranslation';
import { Chain } from '../../../../extension-ui/src/types';
import { PlusHeader } from '../../components';
import Popup from '../../components/Popup';

interface Props {
  address: string;
  chain?: Chain | null;
  name: string;
  showQRcodeModalOpen: boolean;
  setQRcodeModalOpen: Dispatch<SetStateAction<boolean>>;
}

export default function AddressQRcode({ address, chain, name, setQRcodeModalOpen, showQRcodeModalOpen }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();

  const handleQRmodalClose = useCallback((): void => { setQRcodeModalOpen(false); },
    [setQRcodeModalOpen]);

  return (
    <Popup handleClose={handleQRmodalClose} showModal={showQRcodeModalOpen}>
      <PlusHeader action={handleQRmodalClose} chain={chain} closeText={'Close'} icon={<QrCodeScannerIcon fontSize='small' />} title={'Scan with camera'} />

      <Grid item id='name' xs={12} sx={{ fontSize: 18, fontWeight: 'fontWeightBold', textAlign: 'center', padding: '40px 1px 20px' }} >
        {name || t('unknown')}
      </Grid>

      <Grid item xs={12} sx={{ textAlign: 'center' }}>
        <QRCode value={address} size={300} level='H' />
      </Grid>

      <Grid alignItems='center' container justifyContent='center' spacing={1} sx={{ padding: '30px 50px' }}>
        <Grid item>
          <Identicon
            prefix={chain?.ss58Format ?? 42}
            size={24}
            theme={chain?.icon || 'polkadot'}
            value={address}
          />
        </Grid>
        <Grid id='address' item sx={{ fontSize: 14, textAlign: 'center', paddingTop: '25px' }}>
          {address}
        </Grid>
      </Grid>
    </Popup>
  );
}
