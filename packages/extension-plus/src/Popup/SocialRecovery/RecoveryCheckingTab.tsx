// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0

/**
 * @description
 * this component opens recovery checking page to see in which status the social recovery configuration tab should be: make recoverable, remove recovery or close recovery?
 * */

import type { PalletRecoveryRecoveryConfig } from '@polkadot/types/lookup';
import type { ThemeProps } from '../../../../extension-ui/src/types';

import { Grid } from '@mui/material';
import { grey } from '@mui/material/colors';
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

import useTranslation from '../../../../extension-ui/src/hooks/useTranslation';
import { Progress } from '../../components';
import { Rescuer } from '../../util/plusTypes';

interface Props extends ThemeProps {
  recoveryInfo: PalletRecoveryRecoveryConfig | undefined | null;
  className?: string;
  rescuer: Rescuer | undefined | null;
  setStatus: (value: React.SetStateAction<string | undefined>) => void
}

function RecoveryCheckingTab({ recoveryInfo, rescuer, setStatus }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [processTitle, setProcessTitle] = useState<string>('');

  useEffect((): void => {
    if (recoveryInfo === undefined) {
      return setProcessTitle(t('Checking if the account is recoverable'));
    }

    if (recoveryInfo === null) {
      return setStatus('makeRecoverable');
    }

    if (rescuer === undefined) {
      return setProcessTitle(t('Checking if a malicious rescuer is recovering your account'));
    }

    if (rescuer === null) {
      return setStatus('removeRecovery');
    }

    return setStatus('closeRecovery');
  }, [rescuer, recoveryInfo, t, setStatus]);

  return (
    <Grid
      alignItems='center'
      container
      item
      justifyContent='center'
      sx={{ bgcolor: grey[50], borderColor: grey[800], borderRadius: 5, fontSize: 12, height: '400px', mt: 5, overflowY: 'auto', p: '30px' }}
      xs={12}
    >
      <Grid
        item
        py='30px'
        xs={12}
      >
        <Progress title={processTitle} />
      </Grid>
    </Grid>
  );
}

export default styled(RecoveryCheckingTab)`
         height: calc(100vh - 2px);
         overflow: auto;
         scrollbar - width: none;
 
         &:: -webkit - scrollbar {
           display: none;
         width:0,
        }
         .empty-list {
           text - align: center;
   }`;
