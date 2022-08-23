// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0

import * as React from 'react';
import { styled } from '@mui/material/styles';
import Button, { ButtonProps } from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import { purple } from '@mui/material/colors';

const BootstrapButton = styled(Button)({
  boxShadow: 'none',
  textTransform: 'none',
  fontSize: 16,
  padding: '6px 12px',
  border: '1px solid',
  lineHeight: 1.5,
  backgroundColor: '#0063cc',
  borderColor: '#0063cc',

  '&:hover': {
    backgroundColor: '#0069d9',
    borderColor: '#0062cc',
    boxShadow: 'none',
  },
  '&:active': {
    boxShadow: 'none',
    backgroundColor: '#0062cc',
    borderColor: '#005cbf',
  },
  '&:focus': {
    boxShadow: '0 0 0 0.2rem rgba(0,123,255,.5)',
  },
});

const Customized = styled(Button)<ButtonProps>(({ theme }) => ({
  borderRadius: 0,
  height: '44px',
  fontSize: '20px',
  fontWeight: 600,
  textTransform: 'capitalize',
  letterSpacing: '-0.015em',
  color: theme.palette.primary.main,
  backgroundColor: theme.palette.secondary.main,
  '&:hover': {
    backgroundColor: theme.palette.secondary.main,
  },
}));

interface Props {
  title: string;
  style?: any;
}

export default function CustomizedButton({ title, style = {} }: Props) {
  return (
    <Customized fullWidth variant='contained' sx={style}>
      {title}
    </Customized>
  );
}
