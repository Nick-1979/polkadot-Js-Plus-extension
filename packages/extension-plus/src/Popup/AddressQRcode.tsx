// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import { Container, Grid, Modal } from '@mui/material';
import QRCode from 'qrcode.react';
import React, { Dispatch, SetStateAction, useCallback } from 'react';
import ReactDom from 'react-dom';

import Identicon from '@polkadot/react-identicon';

import useTranslation from '../../../extension-ui/src/hooks/useTranslation';
import { Chain } from '../../../extension-ui/src/types';
import PlusHeader from './common/PlusHeader';

interface Props {
  address: string;
  chain?: Chain | null;
  name: string;
  showQRcodeModalOpen: boolean;
  setQRcodeModalOpen: Dispatch<SetStateAction<boolean>>;
}

export default function AddressQRcode({ address, chain, name, setQRcodeModalOpen, showQRcodeModalOpen }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();

 handleQRmodalClose = useCallback((): void => {setQRcodeModalOpen(false);},
    [setQRcodeModalOpen]);

  return ReactDom.createPortal(
    <Modal
      disablePortal
      // eslint-disable-next-line react/jsx-no-bind
      onClose={(_event, reason) => {
        if (reason !== 'backdropClick') {
          handleQRmodalClose();
        }
      }}
      open={showQRcodeModalOpen}
    >
      <div style={{
        backgroundColor: '#FFFFFF',
        display: 'flex',
        height: '100%',
        maxWidth: 700,
        position: 'relative',
        top: '5px',
        transform: `translateX(${(window.innerWidth - 560) / 2}px)`,
        width: '560px'
      }}
      >
        <Container disableGutters maxWidth='md'>
          <PlusHeader action={handleQRmodalClose} chain={chain} closeText={'Close'} icon={<QrCodeScannerIcon />} title={'Scan with Camera'} />

          <Grid item xs={12} sx={{ fontSize: 18, fontWeight: 'fontWeightBold', textAlign: 'center', padding:'40px 1px 20px' }} >
            {name || t('unknown')}
          </Grid>

          <Grid item xs={12} sx={{ textAlign: 'center' }}>
            <QRCode value={address} size={300} level='H' />
          </Grid>

          <Grid alignItems='center' container justifyContent='center' spacing={1} xs={12} sx={{ padding: '30px 50px' }}>
            <Grid item>
              <Identicon
                prefix={chain?.ss58Format ?? 42}
                size={24}
                theme={chain?.icon || 'polkadot'}
                value={address}
              />
            </Grid>
            <Grid item sx={{ fontSize: 14, textAlign: 'center', paddingTop: '25px' }}>
              {address}
            </Grid>
          </Grid>

        </Container>
      </div>
    </Modal>
    , document.getElementById('root')
  );
}
