// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../types';

import { FiberManualRecord as FiberManualRecordIcon } from '@mui/icons-material';
import { Box, List, ListItem, ListItemIcon, ListItemText, Typography } from '@mui/material';
import React, { useCallback, useContext } from 'react';

import { ActionContext } from '../components';
import PButton from '../components/PButton';
import useTranslation from '../hooks/useTranslation';
import PHeaderBrand from '../partials/PHeaderBrand';

interface Props extends ThemeProps {
  className?: string;
}

const Welcome = function ({ className }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const onAction = useContext(ActionContext);

  const _onClick = useCallback(
    (): void => {
      window.localStorage.setItem('welcome_read', 'ok');
      onAction();
    },
    [onAction]
  );

  return (
    <>
      <PHeaderBrand text={t<string>('Polkagate')} />
      <div className={className}>
        <Typography
          component='h1'
          sx={{
            fontSize: '36px',
            fontWeight: 300,
            pb: '20px',
            pt: '25px',
            textAlign: 'center'
          }}
        >Welcome</Typography>
        <Typography
          component={'p'}
          sx={{ fontSize: '14px', fontWeight: 200, textAlign: 'center' }}
        >{t<string>('Before we start, just a couple of notes regarding use:')}</Typography>
        <Box sx={{ backgroundColor: '#000000', border: '0.5px solid #BA2882', borderRadius: '5px', fontSize: '14px', m: '24px 15px 17px', p: '0' }}>
          <List>
            <ListItem>
              <ListItemIcon sx={{ minWidth: '26px', width: '26px' }}><FiberManualRecordIcon sx={{ color: '#BA2882', width: '9px' }} /></ListItemIcon>
              <ListItemText
                primary={t<string>('We do not send any clicks, pageviews or events to a central server.')}
                primaryTypographyProps={{ fontSize: '14px' }}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon sx={{  minWidth: '26px', width: '26px' }}><FiberManualRecordIcon sx={{ color: '#BA2882', width: '9px' }} /></ListItemIcon>
              <ListItemText
                primary={t<string>('We do not use any trackers or analytics.')}
                primaryTypographyProps={{ fontSize: '14px' }}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon sx={{ minWidth: '26px', width: '26px' }}><FiberManualRecordIcon sx={{ color: '#BA2882', width: '9px' }} /></ListItemIcon>
              <ListItemText
                primary={t<string>("We don't collect keys, addresses or any information - your information never leaves this machine.")}
                primaryTypographyProps={{ fontSize: '14px' }}
              />
            </ListItem>
          </List>
        </Box>
        <Typography
          component={'p'}
          sx={{ fontSize: '14px', pl: '25px' }}
        >{t<string>('... we are not in the information collection business (even anonymized).')}</Typography>
      </div>
      <PButton
        _mt='55px'
        _onClick={_onClick}
        _variant={'contained'}
        text={t<string>('Understood, let me continue')}
      />
    </>
  );
};

export default (Welcome);
