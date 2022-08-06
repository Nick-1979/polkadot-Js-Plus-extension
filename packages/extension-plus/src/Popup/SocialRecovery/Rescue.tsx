// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

/**
 * @description
 * this component renders a page to select between rescuing a lost account as a rescuer or as a friend
 * */

import type { ApiPromise } from '@polkadot/api';
import type { DeriveAccountInfo } from '@polkadot/api-derive/types';

import { AdminPanelSettingsOutlined as AdminPanelSettingsOutlinedIcon, HealthAndSafetyOutlined as HealthAndSafetyOutlinedIcon, Support as SupportIcon } from '@mui/icons-material';
import LoadingButton from '@mui/lab/LoadingButton';
import { Avatar, Badge, Button, Grid, Paper } from '@mui/material';
import { green, grey } from '@mui/material/colors';
import { styled } from '@mui/material/styles';
import React, { useCallback, useEffect, useState } from 'react';

import { Chain } from '@polkadot/extension-chains/types';

import useTranslation from '../../../../extension-ui/src/hooks/useTranslation';
import { PlusHeader, Popup } from '../../components';
import { Initiation, nameAddress, RecoveryConsts } from '../../util/plusTypes';
import { getInitiations } from '../../util/subquery/recovery';
import AsFriend from './AsFriend';
import AsResuer from './AsRescuer';

interface Props {
  api: ApiPromise | undefined;
  account: DeriveAccountInfo | undefined;
  accountsInfo: DeriveAccountInfo[] | undefined;
  chain: Chain | null;
  recoveryConsts: RecoveryConsts | undefined;
  addresesOnThisChain: nameAddress[];
  showRescueModal: true;
  setRescueModalOpen: React.Dispatch<React.SetStateAction<boolean | undefined>>;
}

function Rescue({ account, accountsInfo, addresesOnThisChain, api, chain, recoveryConsts, setRescueModalOpen, showRescueModal }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();

  const [activeRescue, setActiveRescue] = useState<Initiation | undefined | null>();
  const [showAsRescuerModal, setShowAsRescuerModal] = useState<boolean>(false);
  const [showAsFriendModal, setShowAsFriendModal] = useState<boolean>(false);

  useEffect(() => {
    const chainName = chain?.name.replace(' Relay Chain', '');

    account?.accountId && chainName && getInitiations(chainName, account.accountId, 'rescuer', true).then((intiation: Initiation | null) => {
      console.log('intiation:', intiation);

      setActiveRescue(intiation);
    });
  }, [account?.accountId, chain]);

  const handleRescuer = useCallback(() => {
    setShowAsRescuerModal(true);
  }, []);

  const handleFriend = useCallback(() => {
    setShowAsFriendModal(true);
  }, []);

  const handleCloseAsRescuer = useCallback(() => {
    setShowAsRescuerModal(false);
  }, []);

  const handleCloseAsFriend = useCallback(() => {
    setShowAsFriendModal(false);
  }, []);

  const handleCloseModal = useCallback((): void => {
    setRescueModalOpen(false);
  }, [setRescueModalOpen]);

  const StyledBadge = styled(Badge)(({ theme }) => ({
    '& .MuiBadge-badge': {
      '&::after': {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        borderRadius: '50%',
        border: '1px solid currentColor',
      }
    }
  }));

  const RescuerSelection = () => (
    <Grid container justifyContent='center' sx={{ pt: 13 }}>
      <Grid alignItems='center' container justifyContent='center' xs={6}>
        <Grid container item justifyContent='center' sx={{ fontSize: 12 }} >
          <StyledBadge
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            badgeContent={<HealthAndSafetyOutlinedIcon fontSize='medium' sx={{ color: '#fc2105' }} />}
            overlap='circular'
          >
            <Avatar onClick={handleRescuer} sx={{ boxShadow: `2px 4px 10px 2px ${grey[300]}`, color: '#1c4a5a', cursor: 'pointer', height: 120, width: 120 }}>
              {t('as Rescuer')}
            </Avatar>
          </StyledBadge>
        </Grid>
        <Grid container justifyContent='center' sx={{ fontSize: 14, fontWeight: 500, lineHeight: '25px', p: '15px' }}>
          <Paper sx={{ borderRadius: '10px', color: grey[500], height: 160, p: '15px 10px', width: '90%' }}>
            {t('You can initiate the recovery of a lost account. When conditions are met, the lost account\'s balances can be withdrawn.')}
            <Grid container justifyContent='center' sx={{ pt: 3 }}>
              <LoadingButton
                color='warning'
                loading={activeRescue === undefined}
                loadingPosition='start'
                onClick={handleRescuer}
                sx={{ textTransform: 'none', width: '80%' }}
                variant='contained'
              >
                {t('Rescue')}
              </LoadingButton>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
      <Grid alignItems='center' container justifyContent='center' xs={6}>
        <Grid container item justifyContent='center' sx={{ fontSize: 12 }} xs={6}>
          <StyledBadge
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            badgeContent={<AdminPanelSettingsOutlinedIcon fontSize='medium' sx={{ color: green[500] }} />}
            overlap='circular'
          >          <Avatar onClick={handleFriend} sx={{ boxShadow: `2px 4px 10px 2px ${grey[300]}`, color: '#1c4a5a', cursor: 'pointer', height: 120, width: 120 }}>
              {t('as Friend')}
            </Avatar>
          </StyledBadge>
        </Grid>
        <Grid container justifyContent='center' sx={{ fontSize: 14, fontWeight: 500, lineHeight: '25px', p: '15px' }}>
          <Paper sx={{ borderRadius: '10px', color: grey[500], height: 160, p: '15px 10px', width: '90%' }}>
            {t('If you are set as a friend account of a lost account, you can vouch the recovery of the lost account by a rescuer.')}
            <Grid container justifyContent='center' sx={{ pt: 3 }}>
              <Button
                onClick={handleFriend}
                sx={{ bgcolor: 'black', textTransform: 'none', width: '80%', '&:hover': { bgcolor: 'black', color: 'orange' } }}
                variant='contained'
              >
                {t('Vouch')}
              </Button>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Grid>
  );

  return (
    <Popup handleClose={handleCloseModal} showModal={showRescueModal}>
      <PlusHeader action={handleCloseModal} chain={chain} closeText={'Close'} icon={<SupportIcon fontSize='small' />} title={t<string>('Rescue another account')} />
      {!showAsRescuerModal && !showAsFriendModal && <RescuerSelection />}
      {showAsRescuerModal &&
        <AsResuer
          account={account}
          accountsInfo={accountsInfo}
          addresesOnThisChain={addresesOnThisChain}
          api={api}
          chain={chain}
          handleCloseAsRescuer={handleCloseAsRescuer}
          lastLostAccount={activeRescue ? { accountId: activeRescue?.lost } : undefined}
          recoveryConsts={recoveryConsts}
          showAsRescuerModal={showAsRescuerModal}
        />
      }
      {showAsFriendModal &&
        <AsFriend
          account={account}
          accountsInfo={accountsInfo}
          addresesOnThisChain={addresesOnThisChain}
          api={api}
          chain={chain}
          handleCloseAsFriend={handleCloseAsFriend}
          recoveryConsts={recoveryConsts}
          showAsFriendModal={showAsFriendModal}
        />
      }
    </Popup>
  );
}

export default React.memo(Rescue);
