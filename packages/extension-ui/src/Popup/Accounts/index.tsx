// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../../types';

import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';

import { AccountWithChildren } from '@polkadot/extension-base/background/types';
import { AccountsStore } from '@polkadot/extension-base/stores'; // added by kami
import getNetworkMap from '@polkadot/extension-ui/util/getNetworkMap';
import keyring from '@polkadot/ui-keyring'; // added by kami
import { cryptoWaitReady } from '@polkadot/util-crypto'; // added by kami

import { AccountContext } from '../../components';
import useTranslation from '../../hooks/useTranslation';
import { Header } from '../../partials';
import AccountsTree from './AccountsTree';
import AddAccount from './AddAccount';

interface Props extends ThemeProps {
  className?: string;
}

function Accounts ({ className }: Props): React.ReactElement {
  const { t } = useTranslation();
  const [filter, setFilter] = useState('');
  const [filteredAccount, setFilteredAccount] = useState<AccountWithChildren[]>([]);
  const { hierarchy } = useContext(AccountContext);
  const networkMap = useMemo(() => getNetworkMap(), []);

   // added by kami
   useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    cryptoWaitReady().then(() => {
      keyring.loadAll({ store: new AccountsStore() });
    });
  }, []);

  useEffect(() => {
    setFilteredAccount(
      filter
        ? hierarchy.filter((account) =>
          account.name?.toLowerCase().includes(filter) ||
          (account.genesisHash && networkMap.get(account.genesisHash)?.toLowerCase().includes(filter))
        )
        : hierarchy
    );
  }, [filter, hierarchy, networkMap]);

  const _onFilter = useCallback((filter: string) => {
    setFilter(filter.toLowerCase());
  }, []);

  return (
    <>
      {(hierarchy.length === 0)
        ? <AddAccount />
        : (
          <>
            <Header
              onFilter={_onFilter}
              showAdd
              showSearch
              showSettings
              text={t<string>('Accounts')}
            />
            <div className={className}>
              {filteredAccount.map((json, index): React.ReactNode => (
                <AccountsTree
                  {...json}
                  key={`${index}:${json.address}`}
                />
              ))}
            </div>
          </>
        )
      }
    </>
  );
}

export default styled(Accounts)`
  height: calc(100vh - 2px);
  overflow-y: scroll;
  margin-top: -25px;
  padding-top: 25px;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
`;
