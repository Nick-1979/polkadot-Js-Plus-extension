// Copyright 2019-2021 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import { CloseRounded, PhotoCameraRounded } from '@mui/icons-material';
import { Avatar, Box, Chip, Container, Divider, Grid, IconButton, Modal } from '@mui/material';
import QRCode from 'qrcode.react';
import React, { Dispatch, SetStateAction, useCallback } from 'react';
import ReactDom from 'react-dom';

import { Chain } from '../../../../extension-ui/src/types';
import useTranslation from '../../../extension-ui/src/hooks/useTranslation';
import getLogo from '../util/getLogo';

interface Props {
  address: string;
  chain?: Chain | null;
  name: string;
  showQRcodeModalOpen: boolean;
  setQRcodeModalOpen: Dispatch<SetStateAction<boolean>>;
}

export default function AddressQRcode({ address, chain, name, setQRcodeModalOpen, showQRcodeModalOpen }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();

  const handleQRmodalClose = useCallback(
    (): void => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      setQRcodeModalOpen(false);
    },
    [setQRcodeModalOpen]
  );

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
        <Container>
          <Grid container justifyContent='flex-start' xs={12} sx={{ paddingTop: '10px' }}>
            <IconButton edge='start' size='small' onClick={handleQRmodalClose}>
              <CloseRounded fontSize='small' />
            </IconButton>
          </Grid>
          <Grid xs={12}>
            <Box fontSize={12} fontWeight='fontWeightBold'>
              <Divider>
                <Chip icon={<PhotoCameraRounded />} label={t('Scan with Camera')} variant='outlined' />
              </Divider>
            </Box>
          </Grid>
          <Grid alignItems='center' container justifyContent='space-between' xs={12} sx={{ padding: '30px 60px 30px' }}>
            <Grid item sx={{ fontSize: 20, fontWeight: 'fontWeightBold' }} >
              {name || t('unknown')}
            </Grid>

            <Grid item >
              <Avatar
                alt={'logo'}
                src={getLogo(chain)}
              // sx={{ height: 45, width: 45 }}
              />
            </Grid>
          </Grid>
          <Grid item xs={12} sx={{ textAlign: 'center' }}>
            <QRCode value={address} size={300} level='H' />
          </Grid>
          <Grid item xs={12} sx={{ fontSize:14, textAlign: 'center', paddingTop: '25px' }}>
            {address}
          </Grid>


        </Container>
      </div>
    </Modal>
    , document.getElementById('root')
  );
}
