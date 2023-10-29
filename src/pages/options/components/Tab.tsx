import React, { useTransition } from 'react';

const Tab: React.FC<{
  children: React.ReactNode,
  hash: string,
  isActive: boolean,
  onClick: () => void
}> = ({ children, hash, isActive, onClick }) => {
  const [isPending, startTransition] = useTransition();
  return <a href={'#' + hash} className={isPending ? 'pending' : (isActive ? 'active' : '')}
    onClick={() => {
      startTransition(() => {
        onClick();
      });
    }}>{children}</a>
}

export default Tab;
