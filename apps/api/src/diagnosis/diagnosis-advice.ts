export const DISEASE_ADVICE: Record<string, string> = {
  healthy: 'Your plant looks healthy. Continue current care routine.',
  Apple___Apple_scab:
    'Remove infected leaves. Apply fungicide and improve air circulation.',
  Apple___Black_rot:
    'Prune infected tissue. Avoid overhead watering.',
  Apple___Cedar_apple_rust:
    'Remove nearby cedar hosts if possible. Apply fungicide in spring.',
  Cherry___Powdery_mildew:
    'Remove affected leaves. Apply sulfur-based fungicide weekly.',
  Corn___Cercospora_leaf_spot:
    'Remove debris. Rotate crops and apply fungicide if severe.',
  Corn___Common_rust:
    'Plant resistant varieties. Fungicide if outbreak is early.',
  Corn___Northern_Leaf_Blight:
    'Improve spacing for airflow. Remove infected leaves.',
  Grape___Black_rot:
    'Prune for airflow. Apply fungicide during wet periods.',
  Grape___Esca:
    'No cure; remove severely affected vines.',
  Grape___Leaf_blight:
    'Remove infected leaves. Apply copper fungicide.',
  Peach___Bacterial_spot:
    'Apply copper spray during dormancy. Avoid overhead irrigation.',
  Pepper___Bacterial_spot:
    'Remove infected plants. Use disease-free seed.',
  Potato___Early_blight:
    'Rotate crops. Apply fungicide and avoid wet foliage.',
  Potato___Late_blight:
    'Remove infected plants immediately. Improve drainage.',
  Tomato___Bacterial_spot:
    'Use resistant varieties. Avoid working wet plants.',
  Tomato___Early_blight:
    'Mulch soil. Remove lower infected leaves.',
  Tomato___Late_blight:
    'Destroy infected plants. Improve spacing and airflow.',
  Tomato___Leaf_Mold:
    'Increase ventilation. Reduce humidity indoors.',
  Tomato___Septoria_leaf_spot:
    'Remove infected leaves. Mulch and rotate crops.',
  Tomato___Spider_mites:
    'Spray undersides with insecticidal soap or neem oil.',
  Tomato___Target_Spot:
    'Remove debris. Apply fungicide and improve airflow.',
  Tomato___Yellow_Leaf_Curl_Virus:
    'Control whiteflies. Remove infected plants.',
  Tomato___mosaic_virus:
    'Remove infected plants. Disinfect tools.',
};

export function getAdvice(label: string): string {
  const key = Object.keys(DISEASE_ADVICE).find(
    (k) => k.toLowerCase() === label.toLowerCase() || label.toLowerCase().includes(k.toLowerCase()),
  );
  return DISEASE_ADVICE[key || ''] || 'Monitor the plant closely. Adjust watering and light as needed.';
}

export function formatLabel(raw: string): string {
  return raw.replace(/___/g, ' - ').replace(/_/g, ' ');
}
