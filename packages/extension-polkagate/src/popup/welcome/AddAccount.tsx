// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../../../../extension-ui/src/types';

import { Typography } from '@mui/material';
import React, { useCallback, useContext } from 'react';

import { ActionContext } from '../../../../extension-ui/src/components';
import PButton from '../../components/PButton';
import useTranslation from '../../../../extension-ui/src/hooks/useTranslation';
import HeaderBrand from '../../patials/HeaderBrand';

interface Props extends ThemeProps {
  className?: string;
}

function AddAccount({ className }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const onAction = useContext(ActionContext);
  const _onClick = useCallback(
    () => onAction('/account/create'),
    [onAction]
  );

  return (
    <>
      <HeaderBrand
        showSettings
        text={t<string>('Polkagate')}
      />
      <div>
        <Typography
          component='p'
          sx={{
            fontSize: '36px',
            fontWeight: 300,
            pb: '20px',
            pt: '25px',
            textAlign: 'center'
          }}
        >
          Welcome
        </Typography>
        <Typography
          component={'p'}
          sx={{ fontSize: '14px', fontWeight: 300, px: '24px' }}
        >
          {t<string>('You currently don’t have any account. Create your first account or import an existing one to get started.')}
        </Typography>
      </div>
      <PButton
        _mt='38px'
        _onClick={_onClick}
        _variant={'contained'}
        text={t<string>('Create a new account')}
      />
      <Typography
        component={'p'}
        sx={{ fontSize: '18px', fontWeight: 300, py: '25px', textAlign: 'center' }}
      >{t<string>('Or')}</Typography>
      <PButton
        _mt='0'
        _onClick={_onClick}
        _variant={'outlined'}
        text={t<string>('Restore from JSON file')}
      />
      <PButton
        _mt='10px'
        _onClick={_onClick}
        _variant={'outlined'}
        text={t<string>('Import from Mnemonic')}
      />
      <PButton
        _mt='10px'
        _onClick={_onClick}
        _variant={'outlined'}
        text={t<string>('Attach QR signer')}
      />
      <PButton
        _mt='10px'
        _onClick={_onClick}
        _variant={'outlined'}
        text={t<string>('Connect ledger device')}
      />
    </>
  );
}

export default (AddAccount);
