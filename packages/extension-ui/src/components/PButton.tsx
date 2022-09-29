// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Button } from '@mui/material';
import React, { useEffect, useState } from 'react';

interface Props {
  text: string;
  _variant: string;
  _onClick: any;
  _mt: string;
}

function PButton({ _onClick, _variant, text, _mt }: Props): React.ReactElement<Props> {
  // Change backGroundColor when button is disable, busy, ...
  const [bgc, setBgc] = useState<string>('#99004F');

  useEffect(() => {
    if (_variant === 'outlined') {
      setBgc('transparent');
    }
  }, [_variant]);

  return (
    <Button
      onClick={_onClick}
      sx={{ background: bgc, borderRadius: '5px', color: '#fff', fontSize: '16px', height: '36px', ml: '6%', mt: _mt, textTransform: 'none', width: '88%' }}
      variant={_variant}
    >
      {text}
    </Button>
  );
}

export default (PButton);
