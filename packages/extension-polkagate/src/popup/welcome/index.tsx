// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../../../../extension-ui/src/types';

import { FiberManualRecord as FiberManualRecordIcon } from '@mui/icons-material';
import { Box, List, ListItem, ListItemIcon, ListItemText, Typography } from '@mui/material';
import React, { useCallback, useContext } from 'react';

import { ActionContext } from '../../../../extension-ui/src/components';
import useTranslation from '../../../../extension-ui/src/hooks/useTranslation';
import PButton from '../../components/PButton';
import HeaderBrand from '../../patials/HeaderBrand';

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
      <HeaderBrand text={t<string>('Polkagate')} />
      <div className={className}>
        <Typography
          component='h2'
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
          sx={{ fontSize: '14px', fontWeight: 300, textAlign: 'center' }}
        >{t<string>('Before we start, just a couple of notes regarding use:')}</Typography>
        <Box sx={{ backgroundColor: 'background.paper', border: '0.5px solid #BA2882', borderRadius: '5px', fontSize: '14px', m: '24px 15px 17px', p: '0' }}>
          <List sx={{ color: 'text.secondary' }}>
            <ListItem>
              <ListItemIcon sx={{ color: '#99004F', minWidth: '26px', width: '26px' }}><FiberManualRecordIcon sx={{ width: '9px' }} /></ListItemIcon>
              <ListItemText
                primary={t<string>('We do not send any clicks, pageviews or events to a central server.')}
                primaryTypographyProps={{ fontSize: '14px' }}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon sx={{ color: '#99004F', minWidth: '26px', width: '26px' }}><FiberManualRecordIcon sx={{ width: '9px' }} /></ListItemIcon>
              <ListItemText
                primary={t<string>('We do not use any trackers or analytics.')}
                primaryTypographyProps={{ fontSize: '14px' }}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon sx={{ color: '#99004F', minWidth: '26px', width: '26px' }}><FiberManualRecordIcon sx={{ width: '9px' }} /></ListItemIcon>
              <ListItemText
                primary={t<string>("We don't collect keys, addresses or any information - your information never leaves this machine.")}
                primaryTypographyProps={{ fontSize: '14px' }}
              />
            </ListItem>
          </List>
        </Box>
        <Typography
          component={'p'}
          sx={{ fontSize: '14px', fontWeight: 300, pl: '25px' }}
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

export default React.memo(Welcome);
