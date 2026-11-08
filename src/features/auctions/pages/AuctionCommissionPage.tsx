import { useState, type FormEvent } from 'react';
import { Button } from '@/shared/components/Button';
import { auctionCommissionApi, auctionError } from '../api/auctions';
import { useAuctionResource } from '../model/useAuctionResource';

export function AuctionCommissionPage() {
  const { data, error, loading, reload, replaceData } = useAuctionResource(auctionCommissionApi.get, 'Could not load the commission policy.');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [failure, setFailure] = useState('');

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    setSaving(true);
    setFailure('');
    setMessage('');
    try {
      const percent = Number(fields.get('percent'));
      const minimumFee = Number(fields.get('minimumFee'));
      replaceData(await auctionCommissionApi.update({ rate: Number((percent / 100).toFixed(4)), minimumFee }));
      setMessage('Commission policy saved.');
    } catch (error) {
      setFailure(auctionError(error, 'Could not save the commission policy.'));
    } finally {
      setSaving(false);
    }
  }

  return <main className="max-w-xl space-y-4 p-5">
    <h1 className="text-2xl font-bold">Auction Commission</h1>
    <p>Changes apply to future auction orders.</p>
    {error && <p role="alert">{error} <button className="underline" onClick={() => void reload()}>Retry</button></p>}
    {loading && <p role="status">Loading policy…</p>}
    {data && <form className="space-y-3 rounded-xl bg-bg-elevated p-4" onSubmit={save} key={`${data.rate}:${data.minimumFee}`}>
      <label className="block">Commission rate (%)
        <input className="mt-1 block rounded border p-2" type="number" name="percent"
          defaultValue={Number((data.rate * 100).toFixed(2))} min="0" max="100" step="0.01" required />
      </label>
      <label className="block">Minimum fee (THB)
        <input className="mt-1 block rounded border p-2" type="number" name="minimumFee"
          defaultValue={data.minimumFee} min="0" max="9999999999.99" step="0.01" required />
      </label>
      <Button type="submit" disabled={saving}>Save policy</Button>
    </form>}
    {message && <p role="status">{message}</p>}
    {failure && <p role="alert">{failure}</p>}
  </main>;
}
