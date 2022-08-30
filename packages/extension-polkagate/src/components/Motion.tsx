// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0

import * as React from 'react';
import { motion } from "framer-motion";


interface Props {
  style?: any;
  children: React.ReactNode;
}

export default function Motion({ children, style }: Props) {
  return (
    <motion.div
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      initial={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {children}
    </motion.div>
  );
}
