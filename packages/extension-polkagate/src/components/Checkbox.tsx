// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../../../extension-ui/src/types';

import React, { useCallback } from 'react';
import styled from 'styled-components';

import Checkmark from '../assets/checkmark.svg';

interface Props {
  checked: boolean;
  className?: string;
  label: string;
  onChange?: (checked: boolean) => void;
  onClick?: () => void;
}

function Checkbox ({ checked, className, label, onChange, onClick }: Props): React.ReactElement<Props> {
  const _onChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => onChange && onChange(event.target.checked),
    [onChange]
  );

  const _onClick = useCallback(
    () => onClick && onClick(),
    [onClick]
  );

  return (
    <div className={className}>
      <label color='text.primary'>
        {label}
        <input
          checked={checked}
          onChange={_onChange}
          onClick={_onClick}
          type='checkbox'
        />
        <span />
      </label>
    </div>
  );
}

export default styled(Checkbox)(({ theme }: ThemeProps) => `
  margin: 41px auto 10px;

  label {
    display: block;
    position: relative;
    cursor: pointer;
    user-select: none;
    padding-left: 45px;
    font-size: 16px;
    font-weight: 300;
    margin: auto;

    & input {
      position: absolute;
      opacity: 0;
      left: 15px;
      cursor: pointer;
      height: 20px;
      width: 20px;
      border-color: #BA2882;
    }

    & span {
      position: absolute;
      top: 2px;
      left: 20px;
      height: 20px;
      width: 20px;
      border-radius: 5px;
      background-color: transparent;
      border: 0.5px solid #BA2882;
      &:after {
        content: '';
        display: none;
        width: 17px;
        height: 15px;
        position: absolute;
        left: 0;
        top: 0;
        mask: url(${Checkmark});
        mask-size: cover;
        background: #BA2882;
      }
    }
  }
  input:checked ~ span:after {
    display: block;
  }
`);
