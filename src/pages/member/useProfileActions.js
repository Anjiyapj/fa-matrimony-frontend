import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { firstName } from '../../lib/utils';

/* Like / pass / favourite / report / block for another member's profile */
export function useProfileActions(m, reload) {
  const toast = useToast();
  const nav = useNavigate();
  const { refreshSummary } = useAuth();
  return async (act) => {
    try {
      if (['like', 'pass', 'fav'].includes(act)) {
        const r = await api.decide(m.id, act);
        toast(r.mutual ? `It's a match with ${firstName(m)}! Messaging is now open ♥` : act === 'like' ? `You liked ${firstName(m)} ♥` : act === 'fav' ? 'Added to favourites ★' : 'Marked as not interested', 3500);
        reload(); refreshSummary();
      }
      if (act === 'msg') m.relation.mutual ? nav(`/chat/${m.id}`) : toast('Messaging opens after you both like each other ♥');
      if (act === 'contact') toast(m.contact ? `📞 ${m.contact.mobile} • ✉ ${m.contact.email}` : 'Contact details unlock after a mutual match', 5000);
      if (act === 'report') {
        const r = window.prompt(`Reason for reporting ${firstName(m)}'s profile:`);
        if (r && r.trim()) {
          await api.reportProfile(m.id, r.trim());
          toast('Profile reported and flagged for review by the Family Apostolate office.', 4500);
        }
      }
      if (act === 'block') {
        if (window.confirm(`Block ${m.name}? You will no longer see each other anywhere on the platform.`)) {
          await api.blockMember(m.id);
          toast(`${firstName(m)} has been blocked. You will no longer see each other.`, 4500);
          refreshSummary();
          nav('/search', { replace: true });
        }
      }
    } catch (e) { toast(e.message); }
  };
}
