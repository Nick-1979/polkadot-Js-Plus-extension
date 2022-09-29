// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../../types';

import { Typography } from '@mui/material';
import React, { useCallback, useContext } from 'react';

import { ActionContext } from '../../components';
import useTranslation from '../../hooks/useTranslation';
import PHeaderBrand from '../../partials/PHeaderBrand';
import PButton from '../../components/PButton';

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
      <PHeaderBrand
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
          sx={{ fontSize: '14px', px: '24px', fontWeight: '200' }}
        >{t<string>('You currently don’t have any account. Create your first account or import an existing one to get started.')}</Typography>
      </div>
      <PButton
        _mt='38px'
        _onClick={_onClick}
        _variant={'contained'}
        text={t<string>('Create a new account')}
      />
      <Typography
        component={'p'}
        sx={{ fontSize: '14px', textAlign: 'center', py: '25px' }}
      >{t<string>('Or')}</Typography>
      <PButton
        _mt='17px'
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
