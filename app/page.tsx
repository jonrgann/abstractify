
import { redirect } from 'next/navigation';

export default async function Home() {
  redirect('/agent'); // Redirect to '/another-page'
  return (<></>);
}
