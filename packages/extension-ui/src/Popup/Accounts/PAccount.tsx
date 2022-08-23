// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { AccountJson } from '@polkadot/extension-base/background/types';

import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';// added for plus, useContext
import styled from 'styled-components';

import { canDerive } from '@polkadot/extension-base/utils';
import { ThemeProps } from '@polkadot/extension-ui/types';

import useEndpoints from '../../../../extension-plus/src/hooks/useEndpoints';// added for plus
import { CROWDLOANS_CHAINS, GOVERNANCE_CHAINS, SOCIAL_RECOVERY_CHAINS } from '../../../../extension-plus/src/util/constants';// added for plus
import { SavedMetaData } from '../../../../extension-plus/src/util/plusTypes';// added for plus
import { prepareMetaData } from '../../../../extension-plus/src/util/plusUtils';// added for plus
import { AccountContext, ActionContext, ActionText, PAddress, Dropdown, Link, MenuDivider, MenuItem, Svg } from '../../components';// added for plus, AccountContext, ActionContext, Svg
import useGenesisHashOptions from '../../hooks/useGenesisHashOptions';
import useTranslation from '../../hooks/useTranslation';
import { editAccount, tieAccount, updateMeta } from '../../messaging';// added for plus, updateMeta
import { Name } from '../../partials';
import { faUserShield, faTent, faPeopleRoof } from '@fortawesome/free-solid-svg-icons';// added for plus,
import { ContentCutOutlined } from '@mui/icons-material';
import { Container, Grid } from '@mui/material';

interface Props extends AccountJson {
  className?: string;
  parentName?: string;
}

interface EditState {
  isEditing: boolean;
  toggleActions: number;
}

export default function PAccount({ address, className, genesisHash, isExternal, isHardware, isHidden, name, parentName, suri, type }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [{ isEditing, toggleActions }, setEditing] = useState<EditState>({ isEditing: false, toggleActions: 0 });
  const [editedName, setName] = useState<string | undefined | null>(name);
  const genesisOptions = useGenesisHashOptions();
  const endpointOptions = useEndpoints(genesisHash); // added for plus
  const { accounts } = useContext(AccountContext);// added for plus
  const account = accounts.find((account) => account.address === address);
  const onAction = useContext(ActionContext);// added for plus

  const [selectedEndpoint, setSelectedEndpoint] = useState<string | undefined | null>(name); // added for plus

  const selectedgenesisOption = genesisOptions?.find((option) => option.value === genesisHash); // added for plus
  const chainName = selectedgenesisOption?.text?.replace(' Relay Chain', ''); // added for plus

  const _onChangeGenesis = useCallback(
    (genesisHash?: string | null): void => {
      tieAccount(address, genesisHash || null)
        .catch(console.error);
    },
    [address]
  );

  // added for plus
  const _onChangeEndpoint = useCallback(
    (selectedEndpoint?: string | null): void => {
      setSelectedEndpoint(selectedEndpoint);

      // eslint-disable-next-line no-void
      chainName && void updateMeta(address, prepareMetaData(chainName, 'endpoint', selectedEndpoint));
    }, [address, chainName]);

  // added for plus
  useEffect(() => {
    const endPointFromStore: SavedMetaData = account?.endpoint ? JSON.parse(account.endpoint) : null;

    if (endPointFromStore && endPointFromStore?.chainName === chainName) {
      setSelectedEndpoint(endPointFromStore.metaData);
    }
  }, [account?.endpoint, address, chainName]);

  const _toggleEdit = useCallback(
    (): void => setEditing(({ toggleActions }) => ({ isEditing: !isEditing, toggleActions: ++toggleActions })),
    [isEditing]
  );

  const _saveChanges = useCallback(
    (): void => {
      editedName &&
        editAccount(address, editedName)
          .catch(console.error);

      _toggleEdit();
    },
    [editedName, address, _toggleEdit]
  );

  // added for plus
  const _goToLink = useCallback(
    (link: string) => {
      if (link === 'crowdloans' && !CROWDLOANS_CHAINS.includes(genesisHash)) {
        return;
      }

      if (link === 'governance' && !GOVERNANCE_CHAINS.includes(genesisHash)) {
        return;
      }

      if (link === 'socialRecovery' && !SOCIAL_RECOVERY_CHAINS.includes(genesisHash)) {
        return;
      }

      onAction(`/${link}/${genesisHash}/${address}`);
    }, [address, genesisHash, onAction]
  );

  const _actions = useMemo(() => (
    <Container>
      {/* // added for plus */}
      <MenuItem className='newMenu'>
        <ActionText
          className={CROWDLOANS_CHAINS.includes(genesisHash) ? 'newMenu' : 'disabledMenu'}
          icon={faPeopleRoof}
          onClick={() => _goToLink('crowdloans')}
          text={t<string>('Crowdloans')}
        />
      </MenuItem>
      <MenuItem className='newMenu'>
        <ActionText
          className={GOVERNANCE_CHAINS.includes(genesisHash) ? 'newMenu' : 'disabledMenu'}
          icon={faTent}
          onClick={() => _goToLink('governance')}
          text={t<string>('Governance')}
        />
      </MenuItem>
      <MenuItem className='newMenu'>
        <ActionText
          className={SOCIAL_RECOVERY_CHAINS.includes(genesisHash) ? 'newMenu' : 'disabledMenu'}
          icon={faUserShield}
          onClick={() => _goToLink('socialRecovery')}
          text={t<string>('Social Recovery')}
        />
      </MenuItem>
      <MenuDivider />
      <Link
        className='menuItem'
        onClick={_toggleEdit}
      >
        {t<string>('Rename')}
      </Link>
      {!isExternal && canDerive(type) && (
        <Link
          className='menuItem'
          to={`/account/derive/${address}/locked`}
        >
          {t<string>('Derive New Account')}
        </Link>
      )}
      <MenuDivider />
      {!isExternal && (
        <Link
          className='menuItem'
          isDanger
          to={`/account/export/${address}`}
        >
          {t<string>('Export Account')}
        </Link>
      )}
      <Link
        className='menuItem'
        isDanger
        to={`/account/forget/${address}`}
      >
        {t<string>('Forget Account')}
      </Link>
      {!isHardware && (
        <>
          <MenuDivider />
          <div className='menuItem'>
            <Dropdown
              className='genesisSelection'
              label=''
              onChange={_onChangeGenesis}
              options={genesisOptions}
              value={genesisHash || ''}
            />
          </div>
          {/* // added for plus */}
          <div className='menuItem'>
            {!!endpointOptions?.length && <Dropdown
              className='genesisSelection'
              label='endpoint'
              onChange={_onChangeEndpoint}
              options={endpointOptions ?? []}
              value={selectedEndpoint || ''}
            />}
          </div>
        </>
      )}
    </Container>
    // added for plus,'_onChangeEndpoint', 'endpointOptions', and 'selectedEndpoint', _goToSocialRecovery
  ), [_goToLink, _onChangeEndpoint, _onChangeGenesis, _toggleEdit, address, endpointOptions, genesisHash, genesisOptions, isExternal, isHardware, selectedEndpoint, t, type]);

  return (
    <Grid sx={{ borderBottomColor: 'secondary.main', borderBottomWidth: '1px', borderBottomStyle: 'solid' }} xs={12}>
      <PAddress
        actions={_actions}
        address={address}
        genesisHash={genesisHash}
        isExternal={isExternal}
        isHidden={isHidden}
        name={editedName}
        parentName={parentName}
        showPlus={true}// added for plus
        suri={suri}
        toggleActions={toggleActions}
      >
        {isEditing && (
          <Name
            address={address}
            isFocused
            label={' '}
            onBlur={_saveChanges}
            onChange={setName}
          />
        )}
      </PAddress>
    </Grid>
  );
}
