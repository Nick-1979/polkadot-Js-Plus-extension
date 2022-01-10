// Copyright 2019-2021 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { faAngleRight,faCoins } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { AllInclusive, CallMade, HistoryRounded } from '@mui/icons-material';
import { Avatar, Box, Container, Divider, Grid, Link, Modal, Tab, Tabs } from '@mui/material';
import { grey } from '@mui/material/colors';
import React, { Dispatch, SetStateAction, useCallback, useContext, useEffect, useReducer, useRef, useState } from 'react';

import { Chain } from '@polkadot/extension-chains/types';

import ActionText from '../../../../extension-ui/src/components/ActionText';
import { AccountContext } from '../../../../extension-ui/src/components/contexts';
import useTranslation from '../../../../extension-ui/src/hooks/useTranslation';
import getLogo from '../../util/getLogo';
import getNetworkInfo from '../../util/getNetwork';
import { getTxTransfers } from '../../util/getTransfers';
import { TransactionDetail, Transfers } from '../../util/pjpeTypes';
import { getTransactionHistoryFromLocalStorage } from '../../util/pjpeUtils';
import { NothingToShow } from '../common/NothingToShow';
import Details from './Details';
import { getIcon } from './getIcons';

interface Props {
  address: string;
  chain?: Chain | null;
  name: string;
  showTxHistoryModal: boolean;
  setTxHistoryModalOpen: Dispatch<SetStateAction<boolean>>;
}

const SINGLE_PAGE_SIZE = 25;
const TAB_MAP = {
  ALL: '0',
  TRANSFERS: '1',
  // eslint-disable-next-line sort-keys
  STAKING: '2'
};

export default function TransactionHistory({ address, chain, name, setTxHistoryModalOpen, showTxHistoryModal }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { hierarchy } = useContext(AccountContext);
  const [tabHistory, setTabHistory] = useState<TransactionDetail[] | []>([]);
  const [coin, setCoin] = useState<string>('');
  const [decimals, setDecimals] = useState<number>(1);
  const [tabValue, setTabValue] = React.useState(TAB_MAP.ALL);
  const [fetchedHistoriesFromSubscan, setFetchedHistoriesFromSubscan] = React.useState<TransactionDetail[] | []>([]);
  const [showDetailModal, setShowDetailModal] = useState<boolean>(false);
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionDetail | undefined>()
  const localHistories = useRef<TransactionDetail[] | []>([]);

  interface recordTabStatus {
    pageNum: number,
    isFetching?: boolean,
    hasMore?: boolean,
    transactions?: Transfers[]
  }

  function stateReducer(state: Object, action: recordTabStatus) {
    return Object.assign({}, state, action);
  }

  const initialState = {
    hasMore: true,
    isFetching: false,
    pageNum: 0,
    transactions: []
  };

  const [transfersTx, setTransfersTx] = useReducer(stateReducer, initialState);

  async function getTransfers(outerState: recordTabStatus) {
    const { pageNum, transactions } = outerState;

    setTransfersTx({
      isFetching: true,
      pageNum: pageNum
    });

    if (!chain) return;

    const res = await getTxTransfers(chain, address, pageNum, SINGLE_PAGE_SIZE);
    const { count, transfers } = res.data || {};
    const nextPageNum = pageNum + 1;

    setTransfersTx({
      hasMore: !(nextPageNum * SINGLE_PAGE_SIZE >= count),
      isFetching: false,
      pageNum: nextPageNum,
      transactions: transactions?.concat(transfers || [])
    });
  }

  const observerInstance = useRef<IntersectionObserver>();
  const receivingTransfers = useRef<recordTabStatus>();

  receivingTransfers.current = transfersTx;

  useEffect(() => {
    console.log('new IntersectionObserver');

    const observerCallback = async (): Promise<void> => {
      console.log(' receivingTransfers.current:', receivingTransfers.current);

      if (receivingTransfers.current?.isFetching) {
        return;
      }

      if (!receivingTransfers.current?.hasMore) {
        return observerInstance?.current?.disconnect();
      }

      await getTransfers(receivingTransfers.current);
    };

    const options = {
      root: document.getElementById('scrollArea'),
      rootMargin: '0px',
      threshold: 1.0
    };

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    observerInstance.current = new IntersectionObserver(observerCallback, options);

    const target = document.getElementById('observerObj');

    if (target) { observerInstance.current.observe(target); }
  }, [tabHistory]);

  useEffect(() => {
    if (!transfersTx?.transactions?.length) return;

    console.log('transfersTx:', transfersTx.transactions)

    const historyFromSubscan: TransactionDetail[] = [];

    transfersTx.transactions.map((tx: Transfers): void => {
      historyFromSubscan.push({
        action: tx.from === address ? 'send' : 'receive',
        amount: tx.amount,
        block: tx.block_num,
        date: tx.block_timestamp * 1000, // to be consistent with the locally saved times
        fee: tx.fee,
        from: tx.from,
        hash: tx.hash,
        status: tx.success ? 'success' : 'failed',
        to: tx.to
      });
    });

    setFetchedHistoriesFromSubscan(historyFromSubscan);

    console.log('historyFromSubscan:', historyFromSubscan);
  }, [transfersTx])
  useEffect(() => {
    if (!chain) {
      console.log('no chain in TransactionHistory');

      return;
    }

    const { coin, decimals } = getNetworkInfo(chain);

    setDecimals(decimals);
    setCoin(coin);

    localHistories.current = getTransactionHistoryFromLocalStorage(chain, hierarchy, address);
  }, [address, hierarchy, chain]);

  useEffect(() => {
    const filteredFetchedHistoriesFromSubscan = fetchedHistoriesFromSubscan.filter((h1) => !localHistories.current.find((h2) => h1.hash === h2.hash));

    let history = (localHistories.current as TransactionDetail[]).concat(filteredFetchedHistoriesFromSubscan);

    history = history.sort(function (a, b) { return b.date - a.date });
    console.log('history', history);

    switch (tabValue) {
      case (TAB_MAP.TRANSFERS):
        history = history.filter((h) => ['send', 'receive'].includes(h.action.toLowerCase()));
        break;
      case (TAB_MAP.STAKING):
        history = history.filter((h) => ['bond', 'unbond', 'bond_extra', 'nominate', 'redeem'].includes(h.action.toLowerCase()));
        break;
      default:
        break;
    };

    // if (history.length > TRANSACTION_HISTROY_DEFAULT_ROWS) {
    //   setHasMoreToLoad(true);
    // } else {
    //   setHasMoreToLoad(false);
    // }

    // if (!moreLoaded) {
    //   history = history.slice(0, TRANSACTION_HISTROY_DEFAULT_ROWS);
    // }

    setTabHistory(history);
  }, [tabValue, fetchedHistoriesFromSubscan]);

  const handleTxHistoryModalClose = useCallback(
    (): void => {
      // set all defaults
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      setTxHistoryModalOpen(false);
    },
    [setTxHistoryModalOpen]
  );

  function makeAddressShort(_address: string): React.ReactElement {
    return (
      <Box
        component='span'
        fontFamily='Monospace'
      >
        {_address.slice(0, 4) +
          '...' +
          _address.slice(-4)}
      </Box>
    );
  }


  const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
    setTabValue(newValue);
  }

  const handleShowTxDetail = (tx: TransactionDetail): void => {
    setShowDetailModal(true);
    setSelectedTransaction(tx);
  }

  return (
    <Modal
      keepMounted
      // eslint-disable-next-line react/jsx-no-bind
      onClose={(_event, reason) => {
        if (reason !== 'backdropClick') {
          handleTxHistoryModalClose();
        }
      }}
      open={showTxHistoryModal}
    >
      <div style={{
        backgroundColor: '#FFFFFF',
        display: 'flex',
        height: '100%',
        width: '100%',
        maxWidth: '560px',
        // maxWidth: '700',
        overflow: 'auto',
        position: 'relative',
        top: '5px',
        transform: `translateX(${(window.innerWidth - 560) / 2}px)`,
        // width: '560px'
      }}
      >
        <Container id='scrollArea' disableGutters maxWidth='md' sx={{ marginTop: 2 }}>
          <Grid item alignItems='center' container justifyContent='space-between' sx={{ padding: '0px 20px' }}>
            <Grid item>
              <Avatar
                alt={'logo'}
                src={getLogo(chain)}
              />
            </Grid>
            <Grid item sx={{ fontSize: 15, fontWeight: 600 }}>
              <HistoryRounded /> {t('Transaction History')}
            </Grid>
            <Grid item sx={{ fontSize: 15 }}>
              <ActionText
                onClick={handleTxHistoryModalClose}
                text={t<string>('Close')}
              />
            </Grid>
          </Grid>
          <Grid xs={12}>
            <Divider />
          </Grid>
          <Grid item xs={12} sx={{ paddingBottom: '10px' }}>
            <Box>
              <Tabs
                textColor='secondary'
                indicatorColor='secondary'
                // centered
                variant='fullWidth'
                value={tabValue}
                onChange={handleTabChange}
              >
                <Tab icon={<AllInclusive fontSize='small' />} iconPosition='start' label='All' sx={{ fontSize: 10 }} value={TAB_MAP.ALL} />
                <Tab icon={<CallMade fontSize='small' />} iconPosition='start' label='Transfers' sx={{ fontSize: 10 }} value={TAB_MAP.TRANSFERS} />
                <Tab icon={<FontAwesomeIcon icon={faCoins} size='lg' />} iconPosition='start' label='Staking' sx={{ fontSize: 10 }} value={TAB_MAP.STAKING} />
              </Tabs>
            </Box>
          </Grid>


          <Grid alignItems='center' container justifyContent='center' sx={{ padding: '0px 30px 5px' }}>
            {tabHistory?.map((h, index) => (
              <>
                <Grid item xs={1}>
                  <FontAwesomeIcon
                    color={getIcon(h.action).color}
                    icon={getIcon(h.action).icon}
                  />
                </Grid>
                <Grid item container xs={10}>
                  <Grid item id='firstRow' container xs={12} sx={{ paddingTop: '10px' }}>
                    <Grid xs={4} sx={{ fontSize: 15, fontVariant: 'small-caps', textAlign: 'left' }}>
                      {h.action}
                    </Grid>
                    <Grid item xs={8} sx={{ fontSize: 13, fontWeight: '600', textAlign: 'right' }}>
                      {h.amount || 'N/A '} {' '}{coin}
                    </Grid>
                  </Grid>
                  <Grid item id='secondRow' container xs={12} sx={{ color: 'gray', fontSize: '10px', paddingBottom: '10px', textAlign: 'left' }}>
                    <Grid item xs={3} >
                      {h.action === 'send' && h.to && <>{t('To:')} {' '} {makeAddressShort(h.to)}</>}
                      {h.action === 'receive' && h.from && <>{t('From:')} {' '}{makeAddressShort(h.from)}</>}
                    </Grid>

                    <Grid item xs={6} sx={{ textAlign: 'center' }}>
                      {new Date(h.date).toDateString()}{' '}{new Date(h.date).toLocaleTimeString()}
                    </Grid>
                    <Grid item xs={3} sx={{ fontSize: 11, textAlign: 'right', color: ['success'].includes(h.status.toLowerCase()) ? 'green' : 'red' }}>
                      {['success'].includes(h.status.toLowerCase()) ? t('Success') : t('Failed')}
                    </Grid>
                  </Grid>
                </Grid>
                <Grid item xs={1} sx={{ textAlign: 'right' }}>
                  <Link href='#'>
                    <FontAwesomeIcon
                      color={grey[500]}
                      icon={faAngleRight}
                      onClick={() => handleShowTxDetail(h)}
                      size='lg'
                    />
                  </Link>
                </Grid>
                {/* <Grid item xs={1} sx={{ textAlign: 'right' }}>
                  <IconButton size='small' edge='end' onClick={() => openTxOnExplorer(h.hash)}>
                    <LaunchRounded fontSize='small' />
                  </IconButton>
                </Grid> */}
                <Grid item xs={12}>
                  <Divider light />
                </Grid>
              </>
            ))}

            {!tabHistory.length && <NothingToShow text={t('Nothing to show')} />}
            
            {/* {!moreLoaded && hasMoreToLoad
              ? <Grid item display='flex' justifyContent='center' xs={12} sx={{ paddingTop: '20px' }}>
                <Button color='primary' onClick={() => setLoadMore(true)} variant='text'>
                  {t('View More')}
                </Button>
              </Grid>
              : ''} */}
            <div id='observerObj'>
              {
                // staking transaction history is saved locall
                tabValue !== TAB_MAP.STAKING &&
                ((transfersTx?.hasMore)
                  ? 'Loading ...'
                  : <Box fontSize={11} sx={{ color: grey[400] }}>
                    {t('No more transactions to load')}
                  </Box>
                )
              }
            </div>

          </Grid>
          {selectedTransaction && showDetailModal &&
            <Details
              chain={chain}
              coin={coin}
              decimals={decimals}
              setShowDetailModal={setShowDetailModal}
              showDetailModal={showDetailModal}
              transaction={selectedTransaction}
            />
          }
        </Container>
      </div>
    </Modal>
  );
}
