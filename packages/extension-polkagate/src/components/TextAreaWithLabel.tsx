// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback } from 'react';
import { useTheme } from '@mui/material';

import Label from './Label';
import { TextArea } from './TextInputs';
import { Height } from '@mui/icons-material';

interface Props {
  className?: string;
  isError?: boolean;
  isFocused?: boolean;
  isReadOnly?: boolean;
  rowsCount?: number;
  label: string;
  onChange?: (value: string) => void;
  value?: string;
}

export default function TextAreaWithLabel({ className, isError, isFocused, isReadOnly, label, onChange, rowsCount, value }: Props): React.ReactElement<Props> {
  const theme = useTheme();

  const _onChange = useCallback(
    ({ target: { value } }: React.ChangeEvent<HTMLTextAreaElement>): void => {
      onChange && onChange(value);
    },
    [onChange]
  );

  return (
    <Label
      className={className}
      label={label}
    >
      <TextArea
        autoCapitalize='off'
        autoCorrect='off'
        autoFocus={isFocused}
        onChange={_onChange}
        readOnly={isReadOnly}
        rows={rowsCount || 2}
        spellCheck={false}
        style={{ height: '88px' }}
        theme={theme}
        value={value}
        withError={isError}
      />
    </Label>
  );
}
