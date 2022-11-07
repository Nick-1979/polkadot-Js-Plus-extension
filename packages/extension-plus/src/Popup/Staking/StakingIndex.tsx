// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable react/jsx-max-props-per-line */
/* eslint-disable header/header */

/**
 * @description
 *  this component provides access to all easy staking stuff where one can choose between Solo and Pool staking.
 * */

 import type { Chain } from '@polkadot/extension-chains/types';
 import type { AccountId, StakingLedger } from '@polkadot/types/interfaces';
 import type { AccountsBalanceType, NominatorInfo, PoolStakingConsts, SavedMetaData, StakingConsts, Validators } from '../../util/plusTypes';
 
 import { faCoins } from '@fortawesome/free-solid-svg-icons';
 import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
 import { CircleOutlined as CircleOutlinedIcon, GroupWorkOutlined as GroupWorkOutlinedIcon } from '@mui/icons-material';
 import { Button, Divider, Grid, Paper } from '@mui/material';
 import { blue, green, grey, red } from '@mui/material/colors';
 import React, { Dispatch, SetStateAction, useCallback, useEffect, useState } from 'react';
 
 import { ApiPromise } from '@polkadot/api';
 import { DeriveAccountInfo } from '@polkadot/api-derive/types';
 import { AccountJson } from '@polkadot/extension-base/background/types';
 import { updateMeta } from '@polkadot/extension-ui/messaging';
 import { BN, bnMax } from '@polkadot/util';
 
 import useTranslation from '../../../../extension-ui/src/hooks/useTranslation';
 import { PlusHeader, Popup, ShowBalance2 } from '../../components';
 import { useEndpoint } from '../../hooks';
 import { prepareMetaData } from '../../util/plusUtils';
 import PoolStaking from './Pool/Index';
 import SoloStaking from './Solo/Index';
 
 interface Props {
   account: AccountJson,
   chain: Chain;
   api: ApiPromise | undefined;
   ledger: StakingLedger | null;
   showStakingModal: boolean;
   setStakingModalOpen: Dispatch<SetStateAction<boolean>>;
   staker: AccountsBalanceType;
 }
 
 const workers: Worker[] = [];
 
 export default function StakingIndex({ account, api, chain, ledger, setStakingModalOpen, showStakingModal, staker }: Props): React.ReactElement<Props> {
   const { t } = useTranslation();
   const endpoint = useEndpoint(account, undefined, chain);
   const chainName = chain?.name.replace(' Relay Chain', '');
 
   const [stakingConsts, setStakingConsts] = useState<StakingConsts | undefined>();
   const [nominatorInfo, setNominatorInfo] = useState<NominatorInfo | undefined>();
   const [poolStakingOpen, setPoolStakingOpen] = useState<boolean>(false);
   const [soloStakingOpen, setSoloStakingOpen] = useState<boolean>(false);
   const [poolStakingConsts, setPoolStakingConsts] = useState<PoolStakingConsts | undefined>();
   const [stakingType, setStakingType] = useState<string | undefined>(undefined);
   const [minToReceiveRewardsInSolo, setMinToReceiveRewardsInSolo] = useState<BN | undefined>();
   const [validatorsInfo, setValidatorsInfo] = useState<Validators | undefined>(); // validatorsInfo is all validators (current and waiting) information
   const [currentEraIndexOfStore, setCurrentEraIndexOfStore] = useState<number | undefined>();
   const [gettingNominatedValidatorsInfoFromChain, setGettingNominatedValidatorsInfoFromChain] = useState<boolean>(true);
   const [validatorsInfoIsUpdated, setValidatorsInfoIsUpdated] = useState<boolean>(false);
   const [validatorsIdentitiesIsFetched, setValidatorsIdentitiesIsFetched] = useState<boolean>(false);
   const [validatorsIdentities, setValidatorsIdentities] = useState<DeriveAccountInfo[] | undefined>();
   const [localStrorageIsUpdate, setStoreIsUpdate] = useState<boolean>(false);
   const [currentEraIndex, setCurrentEraIndex] = useState<number | undefined>();
 
   const getStakingConsts = useCallback((chain: Chain, endpoint: string) => {
     /** 1- get some staking constant like min Nominator Bond ,... */
     const getStakingConstsWorker: Worker = new Worker(new URL('../../util/workers/getStakingConsts.js', import.meta.url));
 
     workers.push(getStakingConstsWorker);
 
     getStakingConstsWorker.postMessage({ endpoint });
 
     getStakingConstsWorker.onerror = (err) => {
       console.log(err);
     };
 
     getStakingConstsWorker.onmessage = (e: MessageEvent<any>) => {
       // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
       const c: StakingConsts = e.data;
 
       if (c) {
         setStakingConsts(c);
 
         if (staker?.address) {
           // eslint-disable-next-line no-void
           void updateMeta(account.address, prepareMetaData(chain, 'stakingConsts', JSON.stringify(c)));
         }
       }
 
       getStakingConstsWorker.terminate();
     };
   }, [account.address, staker?.address]);
 
   const getPoolStakingConsts = useCallback((endpoint: string) => {
     const getPoolStakingConstsWorker: Worker = new Worker(new URL('../../util/workers/getPoolStakingConsts.js', import.meta.url));
 
     workers.push(getPoolStakingConstsWorker);
 
     getPoolStakingConstsWorker.postMessage({ endpoint });
 
     getPoolStakingConstsWorker.onerror = (err) => {
       console.log(err);
     };
 
     getPoolStakingConstsWorker.onmessage = (e: MessageEvent<any>) => {
       // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
       const c: PoolStakingConsts = e.data;
 
       if (c) {
         c.lastPoolId = new BN(c.lastPoolId);
         c.minCreateBond = new BN(c.minCreateBond);
         c.minCreationBond = new BN(c.minCreationBond);
         c.minJoinBond = new BN(c.minJoinBond);
         c.minNominatorBond = new BN(c.minNominatorBond);
 
         setPoolStakingConsts(c);
 
         console.log('poolStakingConst:', c);
 
         if (staker?.address) {
           // eslint-disable-next-line no-void
           void updateMeta(account.address, prepareMetaData(chain, 'poolStakingConsts', JSON.stringify(c)));
         }
       }
 
       getPoolStakingConstsWorker.terminate();
     };
   }, [account.address, chain, staker?.address]);
 
   const getNominatorInfo = (endpoint: string, stakerAddress: string) => {
     const getNominatorInfoWorker: Worker = new Worker(new URL('../../util/workers/getNominatorInfo.js', import.meta.url));
 
     workers.push(getNominatorInfoWorker);
 
     getNominatorInfoWorker.postMessage({ endpoint, stakerAddress });
 
     getNominatorInfoWorker.onerror = (err) => {
       console.log(err);
     };
 
     getNominatorInfoWorker.onmessage = (e: MessageEvent<any>) => {
       // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
       const nominatorInfo: NominatorInfo = e.data;
 
       console.log('nominatorInfo for solo:', nominatorInfo);
 
       setNominatorInfo(nominatorInfo);
       getNominatorInfoWorker.terminate();
     };
   };
 
   const getValidatorsInfo = (chain: Chain, endpoint: string, validatorsInfoFromStore: SavedMetaData) => {
     const getValidatorsInfoWorker: Worker = new Worker(new URL('../../util/workers/getValidatorsInfo.js', import.meta.url));
 
     workers.push(getValidatorsInfoWorker);
 
     getValidatorsInfoWorker.postMessage({ endpoint });
 
     getValidatorsInfoWorker.onerror = (err) => {
       console.log(err);
     };
 
     getValidatorsInfoWorker.onmessage = (e) => {
       // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
       const fetchedValidatorsInfo: Validators | null = e.data;
 
       setGettingNominatedValidatorsInfoFromChain(false);
 
       console.log(`validatorsfrom chain (era:${fetchedValidatorsInfo?.currentEraIndex}), current: ${fetchedValidatorsInfo?.current?.length} waiting ${fetchedValidatorsInfo?.waiting?.length} `);
 
       if (fetchedValidatorsInfo && JSON.stringify(validatorsInfoFromStore?.metaData) !== JSON.stringify(fetchedValidatorsInfo)) {
         setValidatorsInfo(fetchedValidatorsInfo);
         console.log(`save validators to local storage, old was current: ${validatorsInfoFromStore?.metaData?.current?.length} waiting ${validatorsInfoFromStore?.metaData?.waiting?.length} `);
 
         // eslint-disable-next-line no-void
         void updateMeta(account.address, prepareMetaData(chain, 'validatorsInfo', fetchedValidatorsInfo));
       }
 
       setValidatorsInfoIsUpdated(true);
       getValidatorsInfoWorker.terminate();
     };
   };
 
   useEffect(() => {
     /** retrive validatorInfo from local sorage */
     // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
     const validatorsInfoFromStore: SavedMetaData = account?.validatorsInfo ? JSON.parse(account.validatorsInfo) : null;
 
     if (validatorsInfoFromStore && validatorsInfoFromStore?.chainName === chainName) {
       console.log(`validatorsInfo is set from local storage current:${validatorsInfoFromStore.metaData?.current?.length} waiting:${validatorsInfoFromStore.metaData?.waiting?.length}`);
 
       setValidatorsInfo(validatorsInfoFromStore.metaData as Validators);
 
       setCurrentEraIndexOfStore(Number(validatorsInfoFromStore.metaData.currentEraIndex));
       console.log(`validatorsInfro in storage is from era: ${validatorsInfoFromStore.metaData.currentEraIndex}
       on chain: ${validatorsInfoFromStore?.chainName}`);
     }
 
     /** get validators info, including current and waiting, should be called after validatorsInfoFromStore gets value */
     endpoint && getValidatorsInfo(chain, endpoint, validatorsInfoFromStore);
     // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [endpoint, chain, staker.address, account.validatorsInfo, chainName]);
 
   const getValidatorsIdentities = useCallback((endpoint: string, validatorsAccountIds: AccountId[]) => {
     /** get validators identities */
     const getValidatorsIdWorker: Worker = new Worker(new URL('../../util/workers/getValidatorsId.js', import.meta.url));
 
     workers.push(getValidatorsIdWorker);
 
     getValidatorsIdWorker.postMessage({ endpoint, validatorsAccountIds });
 
     getValidatorsIdWorker.onerror = (err) => {
       console.log(err);
     };
 
     getValidatorsIdWorker.onmessage = (e) => {
       // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
       const fetchedIdentities: DeriveAccountInfo[] | null = e.data;
 
       console.log(`got ${fetchedIdentities?.length ?? ''} validators identities from ${chain?.name} `);
 
       /** if fetched differs from saved then setIdentities and save to local storage */
       if (fetchedIdentities?.length && JSON.stringify(validatorsIdentities) !== JSON.stringify(fetchedIdentities)) {
         console.log(`setting new identities #old was: ${validatorsIdentities?.length ?? ''} `);
 
         setValidatorsIdentities(fetchedIdentities);
         setValidatorsIdentitiesIsFetched(true);
         // eslint-disable-next-line no-void
         void updateMeta(account.address, prepareMetaData(chain, 'validatorsIdentities', fetchedIdentities));
       }
 
       getValidatorsIdWorker.terminate();
     };
     // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [account.address, chain]);
 
   useEffect(() => {
     if (!validatorsInfoIsUpdated || !validatorsInfo?.current.length || !endpoint || validatorsIdentitiesIsFetched) { return; }
 
     const validatorsAccountIds = validatorsInfo.current.map((v) => v.accountId).concat(validatorsInfo.waiting.map((v) => v.accountId));
 
     getValidatorsIdentities(endpoint, validatorsAccountIds);
   }, [validatorsInfoIsUpdated, validatorsInfo, endpoint, validatorsIdentitiesIsFetched, getValidatorsIdentities]);
 
   useEffect((): void => {
     if (!currentEraIndex || !currentEraIndexOfStore) { return; }
 
     setStoreIsUpdate(currentEraIndex === currentEraIndexOfStore);
   }, [currentEraIndex, currentEraIndexOfStore]);
 
   useEffect((): void => {
     // eslint-disable-next-line no-void
     api && void api.query.staking.currentEra().then((ce) => {
       setCurrentEraIndex(Number(ce));
     });
   }, [api]);
 
   useEffect(() => {
     if (!account) {
       console.log(' no account, wait for it...!..');
 
       return;
     }
 
     console.log('account in staking stake:', account);
 
     // **** retrive validators identities from local storage
     // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
     const validarorsIdentitiesFromStore: SavedMetaData = account?.validatorsIdentities ? JSON.parse(account.validatorsIdentities) : null;
 
     if (validarorsIdentitiesFromStore && validarorsIdentitiesFromStore?.chainName === chainName) {
       setValidatorsIdentities(validarorsIdentitiesFromStore.metaData as DeriveAccountInfo[]);
     }
   }, [account, chainName]);
 
   useEffect(() => {
     if (!account) {
       console.log(' no account, wait for it...!..');
 
       return;
     }
 
     console.log('Account:', account);
 
     // * retrive staking consts from local sorage
     // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
     const stakingConstsFromLocalStrorage: SavedMetaData = account?.stakingConsts ? JSON.parse(account.stakingConsts) : null;
 
     if (stakingConstsFromLocalStrorage?.metaData && stakingConstsFromLocalStrorage?.chainName === chainName) {
       console.log('stakingConsts from local:', JSON.parse(stakingConstsFromLocalStrorage.metaData as string));
       setStakingConsts(JSON.parse(stakingConstsFromLocalStrorage.metaData as string) as StakingConsts);
     }
 
     // * retrive pool staking consts from local sorage
     // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
     const poolStakingConstsFromLocalStrorage: SavedMetaData = account?.poolStakingConsts ? JSON.parse(account.poolStakingConsts) : null;
 
     if (poolStakingConstsFromLocalStrorage?.metaData && poolStakingConstsFromLocalStrorage?.chainName === chainName) {
       console.log('poolStakingConsts from local:', JSON.parse(poolStakingConstsFromLocalStrorage.metaData as string));
 
       const c = JSON.parse(poolStakingConstsFromLocalStrorage.metaData as string) as PoolStakingConsts;
 
       c.lastPoolId = new BN(c.lastPoolId, 'hex');
       c.minCreateBond = new BN(c.minCreateBond, 'hex');
       c.minCreationBond = new BN(c.minCreationBond, 'hex');
       c.minJoinBond = new BN(c.minJoinBond, 'hex');
       c.minNominatorBond = new BN(c.minNominatorBond, 'hex');
 
       setPoolStakingConsts(c);
     }
   }, [account, chainName]);
 
   useEffect(() => {
     /** get some staking constant like min Nominator Bond ,... */
     endpoint && getStakingConsts(chain, endpoint);
     endpoint && api?.tx?.nominationPools && getPoolStakingConsts(endpoint);
   }, [api, chain, endpoint, getPoolStakingConsts, getStakingConsts]);
 
   useEffect(() => {
     /**  get nominator staking info to consider rebag ,... */
     endpoint && getNominatorInfo(endpoint, staker.address);
   }, [endpoint, staker.address]);
 
   useEffect(() => {
     if (!stakingConsts || !nominatorInfo?.minNominated) { return; }
 
     const minSolo = bnMax(new BN(stakingConsts.minNominatorBond.toString()), new BN(stakingConsts?.existentialDeposit.toString()), new BN(nominatorInfo.minNominated.toString()));
 
     setMinToReceiveRewardsInSolo(minSolo);
   }, [nominatorInfo?.minNominated, stakingConsts]);
 
   const handleStakingModalClose = useCallback((): void => {
     // should terminate workers
     workers.forEach((w) => w.terminate());
 
     setStakingModalOpen(false);
   }, [setStakingModalOpen]);
 
   const handlePoolStakingModalOpen = useCallback(() => {
     // api?.tx?.nominationPools && 
     setPoolStakingOpen(true);
   }, [api]);
 
   const StakingOption = ({ _onClick, condition = true, conditionalText, icon, min, subTitle, text, title, titleColor, type }:
     {
       conditionalText?: string,
       condition?: boolean,
       min: BN | undefined,
       subTitle: string,
       text: string,
       type: 'solo' | 'pool',
       _onClick: React.MouseEventHandler<HTMLButtonElement | HTMLDivElement>,
       icon: JSX.Element,
       title: string,
       titleColor: string
     }) => (
     <Paper elevation={stakingType === type ? 8 : 4} onClick={_onClick} onMouseOver={() => setStakingType(type)} sx={{ borderRadius: '10px', height: 400, pt: 1, width: '45%', cursor: 'pointer' }}>
       <Grid alignItems='center' container direction='column' justifyContent='center' sx={{ fontSize: 14, fontWeight: 700, py: 1 }}>
         <Grid item>
           {icon}
         </Grid>
         <Grid color={titleColor} item>
           <p>{title}</p>
         </Grid>
       </Grid>
       <Grid color={grey[500]} container justifyContent='center' sx={{ fontSize: 14, fontWeight: 500, px: 2 }}>
         {text}      </Grid>
       <Grid item sx={{ fontSize: 12, p: '20px 10px' }} xs={12}>
         <Divider light />
       </Grid>
       {condition
         ? <Grid color={grey[700]} container item justifyContent='space-around' sx={{ fontSize: 12, fontWeight: '600', p: '10px' }} xs={12}>
           <Grid item>
             {subTitle}:
           </Grid>
           <Grid item>
             <ShowBalance2 api={api} balance={min} />
           </Grid>
         </Grid>
         : <Grid color={red[600]} item sx={{ fontSize: 11, p: '10px', textAlign: 'center' }}>
           {conditionalText}
         </Grid>
       }
       <Grid container justifyContent='center' sx={{ pt: 3, pb: 2 }}>
         <Button
           color='warning'
           disabled={!condition}
           onClick={_onClick}
           sx={{ textTransform: 'none', width: '80%' }}
           variant='contained'
         >
           {t('Enter')}
         </Button>
       </Grid>
     </Paper>
   );
 
   return (
     <Popup handleClose={handleStakingModalClose} showModal={showStakingModal}>
       <PlusHeader action={handleStakingModalClose} chain={chain} closeText={'Close'} icon={<FontAwesomeIcon icon={faCoins} size='sm' />} title={'Easy Staking'} />
       <Grid alignItems='center' container justifyContent='space-around' sx={{ p: '60px 10px' }}>
         <StakingOption
           _onClick={() => setSoloStakingOpen(true)}
           icon={<CircleOutlinedIcon sx={{ color: blue[900], fontSize: 30 }} />}
           min={minToReceiveRewardsInSolo}
           subTitle={t('Min to receive rewards')}
           text={t('Stakers (nominators) with sufficient amount of tokens can choose solo staking. Each solo staker will be responsible to nominate validators and keep eyes on them to re-nominate if needed.')}
           title={t('SOLO STAKING')}
           titleColor={blue[600]}
           type='solo'
         />
         <StakingOption
           _onClick={handlePoolStakingModalOpen}
           // condition={!api ? true : !!api?.tx?.nominationPools}
           conditionalText={t('Pool staking is not available on {{chainName}} yet', { replace: { chainName } })}
           icon={<GroupWorkOutlinedIcon sx={{ color: green[900], fontSize: 30 }} />}
           min={poolStakingConsts?.minJoinBond}
           subTitle={t('Min to join a pool')}
           text={t('Stakers (members) with a small amount of tokens can pool their funds together and act as a single nominator. The earnings of the pool are split pro rata to a member\'s stake in the bonded pool.')}
           title={t('POOL STAKING')}
           titleColor={green[600]}
           type='pool'
         />
       </Grid>
       {soloStakingOpen &&
         <SoloStaking
           account={account}
           api={api}
           chain={chain}
           currentEraIndex={currentEraIndex}
           endpoint={endpoint}
           gettingNominatedValidatorsInfoFromChain={gettingNominatedValidatorsInfoFromChain}
           ledger={ledger}
           localStrorageIsUpdate={localStrorageIsUpdate}
           nominatorInfo={nominatorInfo}
           setStakingModalOpen={setStakingModalOpen}
           showStakingModal={showStakingModal}
           staker={staker}
           stakingConsts={stakingConsts}
           validatorsIdentities={validatorsIdentities}
           validatorsInfo={validatorsInfo}
           validatorsInfoIsUpdated={validatorsInfoIsUpdated}
         />
       }
       {poolStakingOpen &&
         <PoolStaking
           account={account}
           api={api}
           chain={chain}
           currentEraIndex={currentEraIndex}
           endpoint={endpoint}
           gettingNominatedValidatorsInfoFromChain={gettingNominatedValidatorsInfoFromChain}
           poolStakingConsts={poolStakingConsts}
           setStakingModalOpen={setStakingModalOpen}
           showStakingModal={showStakingModal}
           staker={staker}
           stakingConsts={stakingConsts}
           validatorsIdentities={validatorsIdentities}
           validatorsInfo={validatorsInfo}
           validatorsInfoIsUpdated={validatorsInfoIsUpdated}
         />
       }
     </Popup>
   );
 }