// Copyright 2019-2021 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import { faCopy } from '@fortawesome/free-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Feed as FeedIcon, LaunchRounded } from '@mui/icons-material';
import { Avatar, Box, Chip, Container, Divider, Grid, Link, Modal, Paper } from '@mui/material';
import React, { Dispatch, SetStateAction, useCallback, useEffect, useState } from 'react';
import CopyToClipboard from 'react-copy-to-clipboard';
import ReactDom from 'react-dom';

import { Chain } from '@polkadot/extension-chains/types';

import ActionText from '../../../../extension-ui/src/components/ActionText';
import useTranslation from '../../../../extension-ui/src/hooks/useTranslation';
import { SHORT_ADDRESS_CHARACTERS } from '../../util/constants';
import getLogo from '../../util/getLogo';
import { TransactionDetail } from '../../util/pjpeTypes';
import { amountToHuman } from '../../util/pjpeUtils';
import { getIcon } from './getIcons';

interface Props {
  chain?: Chain | null;
  coin: string;
  decimals: number;
  showDetailModal: boolean;
  setShowDetailModal: Dispatch<SetStateAction<boolean>>;
  transaction: TransactionDetail;
}


export default function Details({
  chain,
  coin,
  decimals,
  setShowDetailModal,
  showDetailModal,
  transaction }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [showToast, setShowToast] = useState<boolean>(false);

  const network = chain ? chain.name.replace(' Relay Chain', '') : 'westend';
  const subscanLink = (transactionHash: string) => 'https://' + network + '.subscan.io/extrinsic/' + String(transactionHash);

  const handleDetailsModalClose = useCallback(
    (): void => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      setShowDetailModal(false);
    },
    [setShowDetailModal]
  );

  const _onCopy = useCallback((): void => setShowToast(true), []);

  useEffect(() => {
    if (showToast) { setTimeout(setShowToast, 1000, false); }
  }, [showToast]);

  function makeAddressShort(_address: string): React.ReactElement {
    return (
      <Box
        component='span'
        fontFamily='Monospace'
        fontSize={14}
      >
        {_address.slice(0, SHORT_ADDRESS_CHARACTERS) +
          '...' +
          _address.slice(-1 * SHORT_ADDRESS_CHARACTERS)}
      </Box>
    );
  }

  const showAddress = (_addr: string): React.ReactElement => {
    return (
      _addr ?
        <>
          {makeAddressShort(_addr)}{' '}
          <Link href='#'>
            <CopyToClipboard text={_addr}>
              <FontAwesomeIcon
                className='copyIcon'
                icon={faCopy}
                onClick={_onCopy}
                size='lg'
                title={t('copy address')}
              />
            </CopyToClipboard>
          </Link>
        </>
        : <Box>N/A</Box>
    );
  }

  return ReactDom.createPortal(
    <Modal
      disablePortal
      keepMounted
      // eslint-disable-next-line react/jsx-no-bind
      onClose={(_event, reason) => {
        if (reason !== 'backdropClick') {
          handleDetailsModalClose();
        }
      }}
      open={showDetailModal}
    >
      <div style={{
        backgroundColor: '#FFFFFF',
        display: 'flex',
        height: '100%',
        maxWidth: 700,
        overflow: 'none',
        position: 'relative',
        top: '5px',
        transform: `translateX(${(window.innerWidth - 560) / 2}px)`,
        width: '560px'
      }}
      >
        <Container id='scrollArea' disableGutters maxWidth='md' sx={{ marginTop: 2 }}>
          <Grid item id='header' alignItems='center' container justifyContent='space-between' sx={{ padding: '0px 20px' }}>
            <Grid item>
              <Avatar
                alt={'logo'}
                src={getLogo(chain)}
              />
            </Grid>
            <Grid item sx={{ fontSize: 15, fontWeight: 600 }}>
              < FeedIcon /> {t('Transaction Detail')}
            </Grid>
            <Grid item sx={{ fontSize: 15 }}>
              <ActionText
                onClick={handleDetailsModalClose}
                text={t<string>('Close')}
              />
            </Grid>
          </Grid>
          <Grid xs={12}>
            <Divider />
          </Grid>

          <Grid item xs={12} sx={{ padding: '25px 15px 8px' }}>
            <Paper elevation={3}>
              <Grid item container justifyContent='center' sx={{ fontSize: 11, textAlign: 'center', padding: '30px 10px 20px' }}>
                <Grid item xs={12} >
                  <FontAwesomeIcon
                    color={getIcon(transaction.action).color}
                    icon={getIcon(transaction.action).icon}
                  />
                  {' '} {transaction.action}
                </Grid>
                <Grid item xs={12} id='transactionStatus' sx={{ fontSize: 15, fontWeight: 'bold', padding: '10px 1px 10px', color: ['success'].includes(transaction.status.toLowerCase()) ? 'green' : 'red' }}>
                  {['success'].includes(transaction.status.toLowerCase()) ? t('Success') : t('Failed')}
                </Grid>
                <Grid xs={12} id='failureText' sx={{ color: 'gray'}}>
                  {!['success'].includes(transaction.status.toLowerCase()) ? transaction.status : ''}
                </Grid>

                <Grid item xs={12} sx={{ paddingTop: '10px' }}>
                  {new Date(transaction.date).toDateString()}{' '}{new Date(transaction.date).toLocaleTimeString()}
                </Grid>

              </Grid>
            </Paper>
          </Grid>
          <Grid item xs={12} sx={{ fontSize: 14, opacity: showToast ? 1 : 0 }} >
            <Chip label={t<string>('Copied')} />
          </Grid>
          <Grid item xs={12} sx={{ padding: '8px 15px 10px' }}>
            <Paper elevation={3}>
              <Grid container justifyContent='space-between' sx={{ fontSize: 12, padding: '30px 10px 20px' }}>
                <Grid item xs={6} sx={{ textAlign: 'left' }}>
                  {t('Amount')}
                </Grid>
                <Grid item xs={6} sx={{ fontWeight: 'bold', textAlign: 'right', paddingBottom: '10px' }}>
                  {transaction.amount || 'N/A'} {' '}{coin}
                </Grid>

                <Grid item xs={2} sx={{ textAlign: 'left' }}>
                  {t('From')}
                </Grid>
                <Grid item xs={10} sx={{ textAlign: 'right', paddingBottom: '10px' }}>
                  {showAddress(transaction.from)}
                </Grid>

                <Grid item xs={2} sx={{ textAlign: 'left' }}>
                  {t('To')}
                </Grid>
                <Grid item xs={10} sx={{ textAlign: 'right' }}>
                  {showAddress(transaction.to)}
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          <Grid item xs={12} sx={{ padding: '10px 15px 10px' }}>
            <Paper elevation={3}>
              <Grid container justifyContent='space-between' sx={{ fontSize: 12, padding: '30px 10px 20px' }}>
                <Grid item xs={6} sx={{ textAlign: 'left' }}>
                  {t('Fees')}
                </Grid>
                <Grid item xs={6} sx={{ fontWeight: '600', textAlign: 'right', paddingBottom: '10px' }}>
                  {amountToHuman(transaction.fee, decimals)} {' '}{coin}
                </Grid>

                <Grid item xs={2} sx={{ textAlign: 'left' }}>
                  {t('Block')}
                </Grid>
                <Grid item xs={10} sx={{ textAlign: 'right', paddingBottom: '10px' }}>
                  # {transaction.block || 'N/A'}
                </Grid>

                <Grid item xs={1} sx={{ textAlign: 'left' }}>
                  {t('Hash')}
                </Grid>
                <Grid item xs={11} sx={{ textAlign: 'right' }}>
                  {makeAddressShort(transaction.hash) || 'N/A'}{' '}
                  <Link href='#'>
                    <CopyToClipboard text={transaction.hash}>
                      <FontAwesomeIcon
                        className='copyIcon'
                        icon={faCopy}
                        onClick={_onCopy}
                        size='lg'
                        title={t('copy hash')}
                      />
                    </CopyToClipboard>
                  </Link>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          <Grid item xs={12} sx={{ paddingBottom: '20px' }}>
            <Divider light />
          </Grid>

          <Grid item xs={12} sx={{ textAlign: 'center' }}>
            <Link
              href={`${subscanLink(transaction.hash)}`}
              rel='noreferrer'
              target='_blank'
            >
              {'Subscan   '}

              <LaunchRounded color='primary' sx={{ fontSize: 12 }} />
            </Link>
          </Grid>
        </Container>
      </div>
    </Modal>
    , document.getElementById('root')
  );
}
