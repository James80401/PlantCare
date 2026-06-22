import { Navigate, useParams } from 'react-router-dom';

/** Garden task entry points use the same calm care-round workflow as the main task page. */
export default function GardenTasks() {
  const { gardenId } = useParams<{ gardenId: string }>();
  return <Navigate replace to={`/garden/tasks?garden=${encodeURIComponent(gardenId ?? '')}`} />;
}
