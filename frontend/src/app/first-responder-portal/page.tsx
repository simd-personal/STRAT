import IncidentManagement from '../modules/incident-management/page';
import { WebSocketProvider } from '../components/WebSocketProvider';

export default function FirstResponderPortal() {
  return (
    <WebSocketProvider userType="dispatcher">
      <IncidentManagement />
    </WebSocketProvider>
  );
} 