// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import { Button as MuiButton, Grid } from '@mui/material';
import React from 'react';

import { BackButton, Button } from '../../../extension-ui/src/components';
import useTranslation from '../../../extension-ui/src/hooks/useTranslation';

interface Props {
  confirmingState: string;
  handleReject: () => void;
  handleBack: () => void;
  buttonDisableCondition?: boolean;
  handleConfirm: () => Promise<void>;
}

export default function ConfirmButton({ buttonDisableCondition = false, confirmingState, handleBack, handleConfirm, handleReject }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();

  return (
    <Grid container item justifyContent='space-between' sx={{ padding: '5px 10px 0px' }} xs={12}>
      {['success', 'failed'].includes(confirmingState)
        ? <Grid item xs={12}>
          <MuiButton color={confirmingState === 'success' ? 'success' : 'error'} fullWidth onClick={handleReject} size='large' variant='contained'>
            {confirmingState === 'success' ? t('Done') : t('Failed')}
          </MuiButton>
        </Grid>
        : <>
          <Grid item xs={1}>
            <BackButton onClick={handleBack} />
          </Grid>
          <Grid item sx={{ paddingLeft: '10px' }} xs={11}>
            <Button data-button-action='' isBusy={confirmingState === 'confirming'} isDisabled={buttonDisableCondition} onClick={handleConfirm}>
              {t('Confirm')}
            </Button>
          </Grid>
        </>}
    </Grid>
  );
}
