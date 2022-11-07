// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

/** 
 * @description
 * shows memberlists, where can be selected to vote to
*/
import { Grid } from '@mui/material';
import { grey } from '@mui/material/colors';
import React, { useEffect, useState } from 'react';

import { Chain } from '../../../../../../../extension-chains/src/types';
import useTranslation from '../../../../../../../extension-ui/src/hooks/useTranslation';
import { MAX_VOTES } from '../../../../../util/constants';
import { ChainInfo, PersonsInfo } from '../../../../../util/plusTypes';
import Member from '../Member';

interface Props {
  personsInfo: PersonsInfo;
  membersType?: string;
  chain: Chain;
  chainInfo: ChainInfo;
  setSelectedCandidates: React.Dispatch<React.SetStateAction<string[]>>;
}

export default function VoteMembers({ chain, chainInfo, membersType, personsInfo, setSelectedCandidates }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const personsArray = personsInfo.infos.map((info, index) => { return { backed: personsInfo.backed[index], info: info, selected: false }; });

  const [candidates, setCandidates] = useState(personsArray);

  const handleSelect = (event: React.ChangeEvent<HTMLInputElement>, index: number) => {
    // check if reached to MAX_VOTES
    if (event.target.checked && (candidates.filter((c) => c.selected)).length === MAX_VOTES) {
      event.target.checked = false;

      return;
    }

    const lastSelectedIndex = candidates.indexOf(candidates.find((p) => p.selected === false));
    const switched = candidates[index]; // current switched member

    switched.selected = event.target.checked;
    candidates.splice(index, 1); // remove currentlyswitched member fromcandidates
    candidates.splice(lastSelectedIndex, 0, switched); // add it to the end of selected list, whether it is selected or not!
    setCandidates([...candidates]);
  };

  useEffect(() => {
    setSelectedCandidates(candidates.filter((c) => c.selected).map((c) => String(c.info?.accountId)));
  }, [candidates, setSelectedCandidates]);

  return (
    <>
      <Grid
        item
        sx={{ color: grey[600], fontSize: 14, fontWeigth: 'bold', textAlign: 'center', p: '10px 1px 5px' }}
        xs={12}>
        {membersType}
      </Grid>
      {candidates.map((p, index) => (
        <Member
          backed={p.backed}
          chain={chain}
          chainInfo={chainInfo}
          handleSelect={handleSelect}
          hasSwitch={true}
          index={index}
          info={p.info}
          key={index}
          selected={p.selected} />
      ))}
    </>
  );
}
