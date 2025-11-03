import Link from 'next/link';

const Navigation = () => {
  return (
    <nav role="navigation" aria-label="Main navigation">
      <ul role="list">
        <li role="listitem">
          <Link href="/">Home</Link>
        </li>
        <li role="listitem">
          <Link href="/projects">Projects</Link>
        </li>
        <li role="listitem">
          <Link href="/data-ingestion">Data Ingestion</Link>
        </li>
        <li role="listitem">
          <Link href="/reconciliation">Reconciliation</Link>
        </li>
        <li role="listitem">
          <Link href="/admin">Admin</Link>
        </li>
      </ul>
    </nav>
  );
};

export default Navigation;
